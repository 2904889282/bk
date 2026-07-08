import { useState, useEffect } from 'react';
import { Modal, Steps, Form, Input, Button, App, Result } from 'antd';
import { MailOutlined, SafetyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { sendVerifyCode, resetPassword } from '../../api/account';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleClose = () => {
    setCurrent(0);
    setCountdown(0);
    setLoading(false);
    form.resetFields();
    onClose();
  };

  // Step 0: 发送验证码
  const handleSendCode = async () => {
    try {
      const { email } = await form.validateFields(['email']);
      setLoading(true);
      const resp = await sendVerifyCode(email);
      message.success(resp.message);
      // 开发环境提示验证码
      message.info(`验证码: ${resp.code}`);
      setCountdown(60);
      setCurrent(1);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as { message?: string })?.message || '发送失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: 提交重置
  const handleReset = async () => {
    try {
      const { email, code, newPassword, confirmPassword } = await form.validateFields(['code', 'newPassword', 'confirmPassword']);
      if (newPassword !== confirmPassword) return;
      setLoading(true);
      await resetPassword(email, code, newPassword);
      message.success('密码已重置');
      setCurrent(2);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as { message?: string })?.message || '重置失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 重新发送验证码
  const resendCode = async () => {
    try {
      const { email } = form.getFieldsValue(['email']);
      if (!email) return;
      const resp = await sendVerifyCode(email);
      message.success('验证码已重新发送');
      message.info(`验证码: ${resp.code}`);
      setCountdown(60);
    } catch { /* ignore */ }
  };

  const stepItems = [
    { title: '验证身份' },
    { title: '重置密码' },
    { title: '完成' },
  ];

  return (
    <Modal
      title="找回密码"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      width={480}
      className="auth-modal"
    >
      <Steps current={current} items={stepItems} size="small"
        style={{ marginBottom: 28, marginTop: 12 }} />

      <Form form={form} layout="vertical" requiredMark={false} size="large">

        {/* Step 0: 验证身份 */}
        {current === 0 && (
          <>
            <Form.Item
              name="email" label="绑定邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入注册时绑定的邮箱" />
            </Form.Item>
            <Button type="primary" className="auth-btn" block loading={loading} onClick={handleSendCode}>
              获取验证码
            </Button>
          </>
        )}

        {/* Step 1: 重置密码 */}
        {current === 1 && (
          <>
            <Form.Item label="验证码">
              <Input.Group compact>
                <Form.Item name="code" noStyle
                  rules={[{ required: true, message: '请输入验证码' }]}>
                  <Input prefix={<SafetyOutlined />} placeholder="6位验证码" style={{ width: '58%' }} maxLength={6} />
                </Form.Item>
                <Button disabled={countdown > 0} onClick={resendCode} style={{ width: '42%', height: 48 }}>
                  {countdown > 0 ? `${countdown}s 后重发` : '重新获取'}
                </Button>
              </Input.Group>
            </Form.Item>

            <Form.Item name="newPassword" label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="至少 6 位字符" />
            </Form.Item>

            <Form.Item name="confirmPassword" label="确认新密码"
              dependencies={['newPassword']} hasFeedback
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" />
            </Form.Item>

            <Button type="primary" className="auth-btn" block loading={loading} onClick={handleReset}>
              确认重置
            </Button>
          </>
        )}

        {/* Step 2: 完成 */}
        {current === 2 && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#34d399' }} />}
            title="密码重置成功"
            subTitle="您的密码已更新，请使用新密码登录。"
            extra={[
              <Button type="primary" className="auth-btn" key="login" onClick={handleClose}>
                返回登录
              </Button>,
            ]}
          />
        )}
      </Form>
    </Modal>
  );
}
