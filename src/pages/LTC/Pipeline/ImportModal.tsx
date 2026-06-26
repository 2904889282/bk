import { useState } from 'react';
import { Modal, Upload, Button, Statistic, Row, Col, Space, message, Table } from 'antd';
import { DownloadOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload';

const { Dragger } = Upload;

interface ImportResult {
  success: number;
  fail: number;
  skip: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportModal({ open, onClose, onImported }: Props) {
  const [file, setFile] = useState<UploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImport = async () => {
    if (!file) { message.warning('请先选择文件'); return; }
    setUploading(true);
    setResult(null);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file as RcFile);

    try {
      const token = localStorage.getItem('beike_token') || '';
      const res = await fetch('/api/pipelines/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.msg || '导入失败');
        message.error(data.msg || '导入失败');
      } else {
        setResult(data as ImportResult);
        if (data.fail > 0 || data.skip > 0) {
          message.warning(`导入完成: 成功${data.success}条, 失败${data.fail}条, 跳过${data.skip}条`);
        } else {
          message.success(`成功导入 ${data.success} 条管线`);
        }
        onImported();
      }
    } catch {
      message.error('网络错误，导入失败');
      setErrorMsg('网络错误');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('beike_token') || '';
      const res = await fetch('/api/pipelines/import/template', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '管线导入模板.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('模板下载失败');
    }
  };

  const handleDownloadErrors = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file as RcFile);
    try {
      const token = localStorage.getItem('beike_token') || '';
      const res = await fetch('/api/pipelines/import/errors', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '管线导入错误明细.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('错误明细下载失败');
    }
  };

  const resetState = () => { setFile(null); setResult(null); setErrorMsg(''); };

  return (
    <Modal title="📥 导入管线" open={open} onCancel={() => { resetState(); onClose(); }}
      width={640} footer={null} destroyOnClose>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>

        {/* ① 模板下载 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>步骤 1: 下载模板</span>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            管线导入模板.xlsx
          </Button>
        </div>

        {/* ② 文件上传 */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>步骤 2: 上传文件</div>
          <Dragger
            accept=".xlsx,.xls"
            maxCount={1}
            beforeUpload={(f) => {
              const isExcel = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');
              if (!isExcel) { message.error('仅支持 .xlsx / .xls 格式'); return false; }
              if (f.size > 10 * 1024 * 1024) { message.error('文件不能超过 10MB'); return false; }
              setFile(f); return false; // 阻止自动上传
            }}
            onRemove={() => setFile(null)}
            fileList={file ? [file] : []}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此区域</p>
            <p className="ant-upload-hint">仅支持 .xlsx / .xls 格式，最大 10MB，最多 1000 行</p>
          </Dragger>
        </div>

        {/* ③ 确认导入 */}
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" size="large" icon={<UploadOutlined />}
            loading={uploading} disabled={!file || uploading}
            onClick={handleImport}>
            {uploading ? '导入中...' : '开始导入'}
          </Button>
          {errorMsg && <div style={{ color: '#ef4444', marginTop: 8, fontSize: 13 }}>{errorMsg}</div>}
        </div>

        {/* ④ 结果展示 */}
        {result && (
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>导入结果</div>
            <Row gutter={16}>
              <Col span={8}><Statistic title="成功" value={result.success} valueStyle={{ color: '#10b981', fontWeight: 700 }} /></Col>
              <Col span={8}><Statistic title="失败" value={result.fail} valueStyle={{ color: '#ef4444', fontWeight: 700 }} /></Col>
              <Col span={8}><Statistic title="跳过" value={result.skip} valueStyle={{ color: '#f59e0b', fontWeight: 700 }} /></Col>
            </Row>
            {result.fail > 0 && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Button size="small" onClick={handleDownloadErrors}>📥 下载错误明细</Button>
              </div>
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
}
