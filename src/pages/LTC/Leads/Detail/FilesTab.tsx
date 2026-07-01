import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, List, Tag, message, Popconfirm, Space, Modal } from 'antd';
import {
  UploadOutlined, DownloadOutlined, DeleteOutlined,
  FileOutlined, FilePdfOutlined, FileImageOutlined, FileWordOutlined,
  AudioOutlined, EyeOutlined,
} from '@ant-design/icons';
import { uploadFile, fetchAttachmentList, deleteAttachment } from '../../../../api/attachment';

// ─── 后端附件 VO ───
interface AttachmentVO {
  id: number;
  bizType: string;
  bizId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadUserId: number;
  uploadTime: string;
}

/** 根据文件名获取图标 */
function getIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return <FileImageOutlined style={{ color: '#10b981', fontSize: 24 }} />;
  }
  if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 24 }} />;
  if (['doc', 'docx'].includes(ext || '')) return <FileWordOutlined style={{ color: '#3b82f6', fontSize: 24 }} />;
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <AudioOutlined style={{ color: '#f59e0b', fontSize: 24 }} />;
  return <FileOutlined style={{ color: '#999', fontSize: 24 }} />;
}

/** 字节 → 可读大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** 是否为图片 */
function isImage(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '');
}

interface Props {
  bizType: string;
  bizId: number;
}

export default function FilesTab({ bizType, bizId }: Props) {
  const [files, setFiles] = useState<AttachmentVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /** 加载附件列表 */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAttachmentList(bizType, bizId);
      setFiles(data as unknown as AttachmentVO[]);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [bizType, bizId]);

  useEffect(() => { load(); }, [load]);

  /** 上传文件 */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      message.error('文件不能超过 50MB');
      return;
    }
    try {
      setUploading(true);
      await uploadFile(file, bizType, bizId);
      message.success('上传成功');
      await load();
    } catch { /* 错误由请求拦截器处理 */ }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /** 删除附件 */
  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteAttachment(id);
      message.success(`已删除: ${name}`);
      await load();
    } catch { /* 错误由请求拦截器处理 */ }
  };

  /** 预览（图片） */
  const handlePreview = (f: AttachmentVO) => {
    setPreviewUrl(f.fileUrl);
    setPreviewName(f.fileName);
  };

  /** 下载 */
  const handleDownload = (f: AttachmentVO) => {
    // fileUrl 为相对路径，直接在新窗口打开
    window.open(f.fileUrl, '_blank');
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
        <Button type="primary" icon={<UploadOutlined />} loading={uploading}
          onClick={() => fileRef.current?.click()}>
          {uploading ? '上传中…' : '上传文件'}
        </Button>
        <span style={{ color: '#999', fontSize: 12 }}>
          {loading ? '加载中…' : `共 ${files.length} 个文件`}
        </span>
      </Space>

      {!loading && files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无附件</div>
      ) : (
        <List
          loading={loading}
          dataSource={files}
          renderItem={f => (
            <List.Item
              actions={[
                isImage(f.fileName) && (
                  <Button size="small" icon={<EyeOutlined />} key="preview" onClick={() => handlePreview(f)}>
                    预览
                  </Button>
                ),
                <Button size="small" icon={<DownloadOutlined />} key="down" onClick={() => handleDownload(f)}>
                  下载
                </Button>,
                <Popconfirm title="确定删除此附件？" onConfirm={() => handleDelete(f.id, f.fileName)} key="del">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getIcon(f.fileName)}
                title={f.fileName}
                description={
                  <span style={{ fontSize: 12 }}>
                    上传于 {f.uploadTime} · <Tag>{formatSize(f.fileSize)}</Tag>
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* 图片预览弹窗 */}
      <Modal
        open={!!previewUrl}
        title={previewName}
        footer={null}
        onCancel={() => setPreviewUrl('')}
        width={800}
        destroyOnClose
      >
        <img src={previewUrl} alt={previewName} style={{ maxWidth: '100%' }} />
      </Modal>
    </div>
  );
}
