import { useState, useEffect, useRef } from 'react';
import { Button, List, Tag, message, Popconfirm, Space, Modal } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, FileOutlined, FilePdfOutlined, FileImageOutlined, FileWordOutlined, AudioOutlined, EyeOutlined } from '@ant-design/icons';
import type { AttachmentItem } from '../../../../store/useLeadStore';
import { LS_ATTACHMENTS, loadLS, saveLS } from '../../../../store/useLeadStore';

const CATEGORIES = ['方案文档', '报价单', '合同', '沟通记录', '其他'];

function getIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return <FileImageOutlined style={{ color: '#10b981', fontSize: 24 }} />;
  if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 24 }} />;
  if (['doc', 'docx'].includes(ext || '')) return <FileWordOutlined style={{ color: '#3b82f6', fontSize: 24 }} />;
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <AudioOutlined style={{ color: '#f59e0b', fontSize: 24 }} />;
  return <FileOutlined style={{ color: '#999', fontSize: 24 }} />;
}

interface Props { leadId: string; operator: string; onLog: (action: string, detail: string) => void; }

export default function FilesTab({ leadId, operator, onLog }: Props) {
  const [files, setFiles] = useState<AttachmentItem[]>([]);
  const [category, setCategory] = useState('方案文档');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => setFiles(loadLS<AttachmentItem[]>(LS_ATTACHMENTS, []).filter(f => f.leadId === leadId));
  useEffect(() => { load(); }, [leadId]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { message.error('文件不能超过 50MB'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const all = loadLS<AttachmentItem[]>(LS_ATTACHMENTS, []);
      const size = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)}KB` : `${(file.size / (1024 * 1024)).toFixed(1)}MB`;
      const item: AttachmentItem = {
        id: 'AT' + Date.now(), leadId, name: file.name, category,
        uploader: operator, uploadTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        size, url: reader.result as string,
      };
      all.push(item);
      saveLS(LS_ATTACHMENTS, all);
      onLog('上传附件', `上传文件: ${file.name}`);
      message.success('上传成功'); load();
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string, name: string) => {
    const all = loadLS<AttachmentItem[]>(LS_ATTACHMENTS, []).filter(f => f.id !== id);
    saveLS(LS_ATTACHMENTS, all);
    onLog('删除附件', `删除文件: ${name}`);
    message.success('已删除'); load();
  };

  const handlePreview = (f: AttachmentItem) => { setPreviewUrl(f.url); setPreviewName(f.name); };
  const handleDownload = (f: AttachmentItem) => {
    const a = document.createElement('a'); a.href = f.url; a.download = f.name; a.click();
  };

  const categoryFiles = files.filter(f => f.category === category);

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        {CATEGORIES.map(c => (
          <Tag.CheckableTag key={c} checked={category === c} onChange={() => setCategory(c)}
            style={{ padding: '4px 12px', fontSize: 13 }}>
            {c} ({files.filter(f => f.category === c).length})
          </Tag.CheckableTag>
        ))}
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
        <Button type="primary" icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
          上传文件
        </Button>
      </Space>

      {categoryFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无「{category}」分类的文件</div>
      ) : (
        <List dataSource={categoryFiles} renderItem={f => (
          <List.Item actions={[
            <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreview(f)} key="preview">预览</Button>,
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(f)} key="down">下载</Button>,
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(f.id, f.name)} key="del">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}>
            <List.Item.Meta
              avatar={getIcon(f.name)}
              title={f.name}
              description={<span style={{ fontSize: 12 }}>{f.uploader} · {f.uploadTime} · <Tag style={{ marginLeft: 4 }}>{f.size}</Tag></span>}
            />
          </List.Item>
        )} />
      )}

      <Modal open={!!previewUrl} title={previewName} footer={null} onCancel={() => setPreviewUrl('')} width={800} destroyOnClose>
        {previewUrl.startsWith('data:image') ? (
          <img src={previewUrl} alt={previewName} style={{ maxWidth: '100%' }} />
        ) : previewUrl.startsWith('data:application/pdf') ? (
          <iframe src={previewUrl} style={{ width: '100%', height: 500, border: 'none' }} title={previewName} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <FileOutlined style={{ fontSize: 64, color: '#999' }} />
            <p style={{ marginTop: 16 }}>不支持在线预览此文件类型</p>
            <Button onClick={() => handleDownload({ id: '', leadId: '', name: previewName, category: '', uploader: '', uploadTime: '', size: '', url: previewUrl })}>下载查看</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
