-- ============================================================================
-- Databricks用户对话提取 - ETL流程（纯SQL）
-- 架构: Medallion (Bronze → Silver → Gold)
-- 性能: 使用Spark SQL原生函数，避免Python UDF
-- ============================================================================

-- ============================================================================
-- 配置参数
-- ============================================================================

-- 方式1: 在Databricks Notebook中，使用Widget参数:
-- dbutils.widgets.text("days_to_process", "7")
-- dbutils.widgets.text("processing_date", "")

-- 方式2: 直接在SQL中设置变量（当前使用此方式）
-- 可以通过修改下面的值来调整处理范围


-- ============================================================================
-- BRONZE LAYER: 读取原始数据
-- ============================================================================
-- 目的: 从两个源表统一schema，最小处理
-- 技术: UNION ALL，列映射
-- ============================================================================

DROP VIEW IF EXISTS bronze_ai_logs;
CREATE TEMPORARY VIEW bronze_ai_logs AS
SELECT
  'ai_logs' as source_table,
  session_id,
  ai_platform as platform,
  start_at as timestamp,
  total_tokens,
  ai_platform as model,
  concat_text_not_text as raw_content,
  extracted_user_content as user_message_hint,  -- 仅作参考，不直接使用
  is_user_input as is_user_input_flag,          -- 原表标记（不准确，需重新判断）
  COALESCE(cc_user_email, user_email) as user_email,
  user_full_name as user_name,
  org_1 as org,
  DATE(start_at) as date_partition
FROM bdec.prod.bp_ito_itom__ai_logs
WHERE start_at >= date_sub(current_timestamp(), 7)  -- 处理最近7天数据
  AND (cc_user_email IS NOT NULL OR user_email IS NOT NULL)
  AND concat_text_not_text IS NOT NULL;

DROP VIEW IF EXISTS bronze_api_log;
CREATE TEMPORARY VIEW bronze_api_log AS
SELECT
  'api_log' as source_table,
  session_id,
  custom_llm_provider as platform,
  start_time as timestamp,
  total_tokens,
  model,
  extract_content as raw_content,
  extract_content as user_message_hint,
  CAST(NULL AS BOOLEAN) as is_user_input_flag,  -- API log无此字段
  user_email,
  end_user as user_name,
  team_id as org,
  DATE(start_time) as date_partition
FROM bdec.prod.stg_ito__llm_api_log
WHERE start_time >= date_sub(current_timestamp(), 7)  -- 处理最近7天数据
  AND user_email IS NOT NULL
  AND extract_content IS NOT NULL
  AND extract_content != '';

-- 合并Bronze数据
DROP VIEW IF EXISTS bronze_messages;
CREATE TEMPORARY VIEW bronze_messages AS
SELECT * FROM bronze_ai_logs
UNION ALL
SELECT * FROM bronze_api_log;


-- ============================================================================
-- SILVER LAYER: 数据清洗与过滤
-- ============================================================================
-- 目的: 应用提取逻辑，过滤系统消息/工具输出/上下文传递
-- 技术: Spark SQL原生函数（CASE WHEN, RLIKE, SPLIT）
-- 优化: Catalyst优化器可优化，向量化执行
-- ============================================================================

DROP VIEW IF EXISTS silver_messages;
CREATE TEMPORARY VIEW silver_messages AS
SELECT
  *,

  -- ==========================================================================
  -- Layer 1: 上下文传递检测（Context Passthrough Detection）
  -- ==========================================================================
  -- 特征：
  -- 1. 包含会话继续标记
  -- 2. 存在---line---分隔符且后续内容>500字符
  -- 3. 总长度>2000字符（包含大量系统上下文）
  -- ==========================================================================
  CASE
    -- 特征1: 显式会话继续标记
    WHEN raw_content LIKE '%This session is being continued%' THEN TRUE

    -- 特征2: 分隔符后有大量内容（使用数组索引）
    WHEN raw_content RLIKE '---line-{3,}.*'
         AND LENGTH(COALESCE(SPLIT(raw_content, '---line-')[1], '')) > 500 THEN TRUE

    -- 特征3: 异常总长度
    WHEN LENGTH(raw_content) > 2000 THEN TRUE

    ELSE FALSE
  END as is_context_passthrough,

  -- ==========================================================================
  -- Layer 2: 工具输出检测（Tool Output Detection）
  -- ==========================================================================
  -- 特征：
  -- 1. 以"Command:"开头
  -- 2. 包含测试框架标记
  -- 3. 包含"Output:"模式
  -- ==========================================================================
  CASE
    -- 命令输出模式
    WHEN raw_content RLIKE '^\\s*Command:' THEN TRUE

    -- 测试框架标记
    WHEN raw_content RLIKE '\\[\\s*(RUN|OK|FAILED|PASSED)\\s*\\]' THEN TRUE

    -- 输出标记
    WHEN raw_content LIKE '%Output:%' THEN TRUE

    ELSE FALSE
  END as is_tool_output,

  -- ==========================================================================
  -- Layer 3: 系统消息检测（System Message Detection）
  -- ==========================================================================
  -- 包含20+系统标记的组合正则
  -- 优化：单个RLIKE组合所有模式，减少多次匹配
  -- ==========================================================================
  CASE
    -- 空或过短
    WHEN TRIM(raw_content) = '' OR LENGTH(TRIM(raw_content)) < 3 THEN TRUE

    -- 精确匹配
    WHEN TRIM(raw_content) = 'Warmup' THEN TRUE

    -- 组合正则（包含20+标记）
    WHEN raw_content RLIKE '(<command-message>|<command-name>|<is_displaying_contents>|<filepaths>|<local-command-stdout>)' THEN TRUE
    WHEN raw_content RLIKE '(gitStatus:|Working directory:|Platform:|You are Claude Code|You are powered by)' THEN TRUE
    WHEN raw_content RLIKE '(_x001b_|litellm_truncated|Files modified by user)' THEN TRUE
    WHEN raw_content RLIKE '(Analysis:|Let me chronologically analyze|Please write a 5-10 word title)' THEN TRUE
    WHEN raw_content RLIKE '(successfully edited|File written to|Reading file:)' THEN TRUE
    WHEN raw_content LIKE '%[Request interrupted by user]%' THEN TRUE
    WHEN raw_content LIKE '%"isNewTopic"%' THEN TRUE
    WHEN raw_content LIKE '%Caveat: The messages below were generated%' THEN TRUE

    -- 长文本+特定模式（系统生成的总结）
    WHEN LENGTH(raw_content) > 3000
         AND raw_content LIKE '%Analysis:%'
         AND raw_content LIKE '%Summary:%' THEN TRUE

    ELSE FALSE
  END as is_system_message,

  -- ==========================================================================
  -- 提取用户输入内容
  -- ==========================================================================
  -- 策略：如果有---line---分隔符，提取第一部分；否则使用全文
  -- 优化：使用SPLIT而非正则，性能更好
  -- 注意：Databricks中SPLIT返回数组，使用[0]索引
  -- ==========================================================================
  CASE
    WHEN raw_content RLIKE '---line-{3,}' THEN TRIM(SPLIT(raw_content, '---line-')[0])
    ELSE TRIM(raw_content)
  END as extracted_message,

  -- ==========================================================================
  -- 消息长度（用于后续过滤）
  -- ==========================================================================
  LENGTH(TRIM(
    CASE
      WHEN raw_content RLIKE '---line-{3,}' THEN SPLIT(raw_content, '---line-')[0]
      ELSE raw_content
    END
  )) as message_length

FROM bronze_messages;


-- ============================================================================
-- SILVER - Filtered: 过滤后的真实用户输入
-- ============================================================================
-- 应用所有过滤条件
-- ============================================================================

DROP VIEW IF EXISTS silver_user_inputs;
CREATE TEMPORARY VIEW silver_user_inputs AS
SELECT
  source_table,
  session_id,
  platform,
  timestamp,
  total_tokens,
  model,
  extracted_message,
  message_length,
  user_email,
  user_name,
  org,
  date_partition
FROM silver_messages
WHERE is_context_passthrough = FALSE
  AND is_tool_output = FALSE
  AND is_system_message = FALSE
  AND message_length >= 5;  -- 最小长度过滤


-- ============================================================================
-- SILVER - Deduplicated: 会话感知去重
-- ============================================================================
-- 技术：窗口函数 ROW_NUMBER()
-- 策略：同一session内相同消息只保留首次出现
-- 性能：高效，无shuffle（分区内排序）
-- ============================================================================

DROP VIEW IF EXISTS silver_deduplicated;
CREATE TEMPORARY VIEW silver_deduplicated AS
SELECT
  source_table,
  session_id,
  platform,
  timestamp,
  total_tokens,
  model,
  extracted_message as cleaned_user_message,
  user_email,
  user_name,
  org,
  date_partition,
  platform as platform_partition  -- 分区列副本
FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, extracted_message
      ORDER BY timestamp ASC
    ) as message_rank
  FROM silver_user_inputs
)
WHERE message_rank = 1;


-- ============================================================================
-- GOLD LAYER: 业务数据表
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Gold Table 1: 用户对话表
-- ----------------------------------------------------------------------------
-- 使用MERGE INTO实现Upsert（支持增量更新）
-- ----------------------------------------------------------------------------

MERGE INTO unity_plat.atit_rd_dev.extracted_ai_conversation AS target
USING silver_deduplicated AS source
ON target.session_id = source.session_id
   AND target.timestamp = source.timestamp
   AND target.user_email = source.user_email
   AND target.cleaned_user_message = source.cleaned_user_message
WHEN MATCHED THEN
  UPDATE SET
    target.total_tokens = source.total_tokens,
    target.model = source.model,
    target.user_name = source.user_name,
    target.org = source.org
WHEN NOT MATCHED THEN
  INSERT (
    source_table,
    session_id,
    platform,
    timestamp,
    total_tokens,
    model,
    cleaned_user_message,
    user_name,
    user_email,
    org,
    date_partition,
    platform_partition
  )
  VALUES (
    source.source_table,
    source.session_id,
    source.platform,
    source.timestamp,
    source.total_tokens,
    source.model,
    source.cleaned_user_message,
    source.user_name,
    source.user_email,
    source.org,
    source.date_partition,
    source.platform_partition
  );


-- ----------------------------------------------------------------------------
-- Gold Table 2: 会话汇总表
-- ----------------------------------------------------------------------------
-- 从Gold对话表聚合生成
-- 使用MERGE INTO支持增量更新
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS gold_sessions_temp;
CREATE TEMPORARY VIEW gold_sessions_temp AS
SELECT
  source_table,
  session_id,
  platform,
  COUNT(*) as total_calls,
  SUM(total_tokens) as session_tokens,
  COUNT(DISTINCT cleaned_user_message) as user_inputs,
  MIN(timestamp) as session_start,
  MAX(timestamp) as session_end,
  FIRST(user_name) as user_name,
  FIRST(user_email) as user_email,
  FIRST(org) as org,
  DATE(MIN(timestamp)) as date_partition,
  FIRST(platform) as platform_partition  -- 分区列副本
FROM unity_plat.atit_rd_dev.extracted_ai_conversation
WHERE date_partition >= date_sub(current_date(), 7)  -- 处理最近7天数据
GROUP BY source_table, session_id, platform, user_email;


MERGE INTO unity_plat.atit_rd_dev.extracted_ai_user_sessions AS target
USING gold_sessions_temp AS source
ON target.session_id = source.session_id
   AND target.user_email = source.user_email
WHEN MATCHED THEN
  UPDATE SET
    target.total_calls = source.total_calls,
    target.session_tokens = source.session_tokens,
    target.user_inputs = source.user_inputs,
    target.session_start = source.session_start,
    target.session_end = source.session_end,
    target.user_name = source.user_name,
    target.org = source.org,
    target.date_partition = source.date_partition
WHEN NOT MATCHED THEN
  INSERT (
    source_table,
    session_id,
    platform,
    total_calls,
    session_tokens,
    user_inputs,
    session_start,
    session_end,
    user_name,
    user_email,
    org,
    date_partition,
    platform_partition
  )
  VALUES (
    source.source_table,
    source.session_id,
    source.platform,
    source.total_calls,
    source.session_tokens,
    source.user_inputs,
    source.session_start,
    source.session_end,
    source.user_name,
    source.user_email,
    source.org,
    source.date_partition,
    source.platform_partition
  );


-- ============================================================================
-- 执行统计和验证
-- ============================================================================

-- 输出处理统计
SELECT
  'PROCESSING_STATS' as metric_type,
  COUNT(DISTINCT source_table) as source_tables,
  COUNT(*) as bronze_records,
  (SELECT COUNT(*) FROM silver_user_inputs) as silver_records,
  (SELECT COUNT(*) FROM silver_deduplicated) as deduplicated_records,
  ROUND((SELECT COUNT(*) FROM silver_deduplicated) * 100.0 / COUNT(*), 2) as extraction_rate_pct,
  ROUND((COUNT(*) - (SELECT COUNT(*) FROM silver_deduplicated)) * 100.0 / COUNT(*), 2) as dedup_rate_pct
FROM bronze_messages;

-- 数据质量检查 - 对话表
SELECT
  'DATA_QUALITY_CONVERSATIONS' as metric_type,
  (SELECT COUNT(*) FROM unity_plat.atit_rd_dev.extracted_ai_conversation WHERE cleaned_user_message IS NULL) as null_messages,
  (SELECT COUNT(*) FROM unity_plat.atit_rd_dev.extracted_ai_conversation WHERE cleaned_user_message = '') as empty_messages,
  (SELECT COUNT(*) FROM unity_plat.atit_rd_dev.extracted_ai_conversation WHERE cleaned_user_message RLIKE '<command-message>|gitStatus:|Warmup') as system_leakage
FROM (SELECT 1) dummy;

-- 数据质量检查 - 会话表
SELECT
  'DATA_QUALITY_SESSIONS' as metric_type,
  (SELECT COUNT(*) FROM unity_plat.atit_rd_dev.extracted_ai_user_sessions WHERE user_inputs = 0) as zero_input_sessions,
  (SELECT COUNT(*) FROM unity_plat.atit_rd_dev.extracted_ai_user_sessions WHERE session_tokens IS NULL) as null_tokens,
  (SELECT COUNT(*) FROM unity_plat.atit_rd_dev.extracted_ai_user_sessions WHERE session_start IS NULL OR session_end IS NULL) as invalid_timestamps
FROM (SELECT 1) dummy;

-- 会话统计
SELECT
  'SESSION_STATS' as metric_type,
  COUNT(*) as total_sessions,
  SUM(user_inputs) as total_inputs,
  SUM(session_tokens) as total_tokens,
  AVG(user_inputs) as avg_inputs_per_session,
  AVG(session_tokens) as avg_tokens_per_session
FROM unity_plat.atit_rd_dev.extracted_ai_user_sessions
WHERE date_partition >= date_sub(current_date(), 7);  -- 处理最近7天数据


-- ============================================================================
-- 完成标记
-- ============================================================================
SELECT 'ETL_COMPLETED' as status, current_timestamp() as completed_at;
