/**
 * ALE 数据库表验证脚本
 * 
 * 用于验证所有 ALE 相关的数据表是否正确创建
 */

import { Application } from '@nocobase/server';

const ALE_TABLES = [
  // 构建态表
  'ale_intents',
  'ale_proposals',
  'ale_conversations',
  // 运行态表
  'ale_ontology_objects',
  'ale_ontology_relations',
  'ale_flows',
  'ale_actions',
  'ale_rules',
  // 共享表
  'ale_changesets',
  'ale_gate_reports',
  'ale_evidences',
  'ale_audit_logs',
  'ale_version_snapshots',
];

async function verifyTables(app: Application) {
  console.log('开始验证 ALE 数据表...\n');
  
  const db = app.db;
  const results: Array<{ table: string; exists: boolean; error?: string }> = [];
  
  for (const tableName of ALE_TABLES) {
    try {
      const collection = db.getCollection(tableName);
      if (collection) {
        // 尝试查询表结构
        await db.sequelize.getQueryInterface().describeTable(collection.model.tableName);
        results.push({ table: tableName, exists: true });
        console.log(`✅ ${tableName} - 表已创建`);
      } else {
        results.push({ table: tableName, exists: false, error: 'Collection not found' });
        console.log(`❌ ${tableName} - Collection 未找到`);
      }
    } catch (error) {
      results.push({ 
        table: tableName, 
        exists: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log(`❌ ${tableName} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log('\n验证结果汇总:');
  const successCount = results.filter(r => r.exists).length;
  const failCount = results.filter(r => !r.exists).length;
  
  console.log(`总计: ${ALE_TABLES.length} 个表`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);
  
  if (failCount > 0) {
    console.log('\n失败的表:');
    results.filter(r => !r.exists).forEach(r => {
      console.log(`  - ${r.table}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ 所有表验证通过！');
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('此脚本需要在 NocoBase 应用上下文中运行');
  console.log('请使用: yarn nocobase exec scripts/verify-ale-tables.ts');
}

export { verifyTables };
