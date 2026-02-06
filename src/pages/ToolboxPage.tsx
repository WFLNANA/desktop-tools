/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-22 18:11:57
 * @LastEditTime : 2026-01-26 11:09:06
 */
import { Empty } from 'antd';
import '../styles/main.scss';

export function ToolboxPage() {
  return (
    <div className="main-content">
      <div className="empty-state">
        <Empty
          description="工具箱功能开发中"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: '100px' }}
        />
      </div>
    </div>
  );
}
