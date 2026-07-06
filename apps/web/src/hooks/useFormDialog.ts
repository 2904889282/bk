import { useState, useCallback, useRef } from 'react';
import type { FormInstance } from 'antd';
import { message, Modal } from 'antd';

interface UseFormDialogOptions<T extends object> {
  /** 新增的默认值 */
  defaultValues?: Partial<T>;
  /** 提交函数 (values, editingId) → Promise */
  onSubmit: (values: T, editingId: number | null) => Promise<void>;
  /** 提交成功后的回调 */
  onSuccess?: () => void;
}

interface Identifiable { id: number; }

export function useFormDialog<T extends object>(options: UseFormDialogOptions<T>) {
  const { defaultValues = {} as Partial<T>, onSubmit, onSuccess } = options;

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<FormInstance>(null);

  const openCreate = useCallback(() => {
    setEditingId(null);
    formRef.current?.resetFields();
    formRef.current?.setFieldsValue(defaultValues);
    setOpen(true);
  }, [defaultValues]);

  const openEdit = useCallback((record: T & Identifiable) => {
    setEditingId(record.id);
    formRef.current?.setFieldsValue(record);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const submit = useCallback(async () => {
    try {
      const values = await formRef.current!.validateFields();
      setSubmitting(true);
      await onSubmit(values as T, editingId);
      message.success(editingId ? '更新成功' : '创建成功');
      setOpen(false);
      onSuccess?.();
    } catch {
      /* 表单校验失败或接口报错，不关闭弹窗 */
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit, editingId, onSuccess]);

  const confirmDelete = useCallback(
    (record: T & Identifiable, deleteApi: (id: number) => Promise<void>, label?: string) => {
      Modal.confirm({
        title: '确认删除',
        content: label ? `确定删除「${label}」？` : '确定删除该记录？',
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          await deleteApi(record.id);
          message.success('已删除');
          onSuccess?.();
        },
      });
    },
    [onSuccess]
  );

  return {
    open, editingId, submitting, formRef,
    openCreate, openEdit, close, submit, confirmDelete,
  };
}
