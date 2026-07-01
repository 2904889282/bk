import request from './request';

export function uploadFile(file: File, bizType: string, bizId: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bizType', bizType);
  formData.append('bizId', String(bizId));
  return request.post('/attachment/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function fetchAttachmentList(bizType: string, bizId: number) {
  return request.get(`/attachment/${bizType}/${bizId}`);
}

export function deleteAttachment(id: number) {
  return request.delete(`/attachment/${id}`);
}
