import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, App, Result } from 'antd';
import { MailOutlined, SafetyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { sendVerifyCode, resetPassword } from '../../api/account';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [step, setStep] = useState<'send' | 'reset' | 'done'>('send');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleClose = () => {
    setStep('send');
    setCountdown(0);
    setLoading(false);
    setSending(false);
    form.resetFields();
    onClose();
  };

  // 发送验证码
  const handleSendCode = async () => {
    try {
      const { email } = await form.validateFields(['email']);
      setSending(true);
      const resp = await sendVerifyCode(email);
      message.success(resp.message || '验证码已发送');
      message.info(`验证码: ${resp.code}`);
      setCountdown(60);
      setStep('reset');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as { message?: string })?.message || '发送失败';
      message.error(msg);
    } finally {
      setSending(false);
    }
  };

  // 重新发送
  const resendCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) return;
      const resp = await sendVerifyCode(email);
      message.success('验证码已重新发送');
      message.info(`验证码: ${resp.code}`);
      setCountdown(60);
    } catch { /* ignore */ }
  };

  // 提交重置
  const handleReset = async () => {
    try {
      const values = await form.validateFields(['code', 'newPassword', 'confirmPassword']);
      const email = form.getFieldValue('email');
      if (!email) { message.error('邮箱信息丢失，请重新开始'); handleClose(); return; }
      if (values.newPassword !== values.confirmPassword) return;
      setLoading(true);
      await resetPassword(email, values.code, values.newPassword);
      message.success('密码已重置');
      setStep('done');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as { message?: string })?.message || '重置失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------- 步骤指示器 ----------
  const steps = [
    { key: 'send', label: '验证身份' },
    { key: 'reset', label: '重置密码' },
    { key: 'done', label: '完成' },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <Modal
      title={<span style={{ color: '#f1f5f9', fontSize: 18 }}>找回密码</span>}
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      width={460}
      className="auth-modal"
      styles={{
        // @ts-ignore - antd v6 content/body/header/mask inline styles
        content: {
          background: '#141c30',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.12)',
        },
        body: { background: '#141c30', color: '#e2e8f0' },
        header: { background: '#141c30', borderBottom: 'none' },
        mask: { backdropFilter: 'blur(4px)' },
      }}
    >
      {/* 步骤条 — 纯文字，避免 antd Steps 组件深色兼容问题 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 28, marginTop: 8 }}>
        {steps.map((s, i) => {
          const isActive = i <= stepIdx;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: '50%', fontSize: 13, fontWeight: 600,
                background: i < stepIdx ? '#22c55e' : i === stepIdx ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all .3s ease',
              }}>
                {i < stepIdx ? '✓' : i + 1}
              </span>
              <span style={{
                fontSize: 13, fontWeight: i === stepIdx ? 600 : 400,
                color: isActive ? '#e2e8f0' : 'rgba(255,255,255,0.32)',
                transition: 'color .3s ease',
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>

      <Form form={form} layout="vertical" requiredMark={false} size="large">
        {/* 邮箱 — 始终显示但发送成功后禁用 */}
        <Form.Item
          name="email" label="绑定邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="请输入注册时绑定的邮箱"
            disabled={step !== 'send'}
          />
        </Form.Item>

        {/* 发送验证码按钮 */}
        {step === 'send' && (
          <Button type="primary" className="auth-btn" block loading={sending} onClick={handleSendCode}
            style={{ marginTop: -8 }}>
            获取验证码
          </Button>
        )}

        {/* 验证码 + 密码 — 发送后显示 */}
        {step !== 'send' && (
          <>
            <Form.Item label="验证码" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Form.Item name="code" noStyle
                  rules={[
                    { required: true, message: '请输入验证码' },
                    { len: 6, message: '验证码为6位数字' },
                  ]}
                >
                  <Input prefix={<SafetyOutlined />} placeholder="6位验证码"
                    maxLength={6} style={{ flex: 1, height: 48 }} />
                </Form.Item>
                <Button disabled={countdown > 0} onClick={resendCode}
                  style={{ height: 48, minWidth: 110, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: countdown > 0 ? 'rgba(255,255,255,0.38)' : '#93c5fd' }}>
                  {countdown > 0 ? `${countdown}s` : '重新获取'}
                </Button>
              </div>
            </Form.Item>

            <Form.Item name="newPassword" label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="至少6位字符" />
            </Form.Item>

            <Form.Item name="confirmPassword" label="确认新密码"
              dependencies={['newPassword']}
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

        {/* 完成 */}
        {step === 'done' && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#22c55e' }} />}
            title={<span style={{ color: '#f1f5f9' }}>密码重置成功</span>}
            subTitle={<span style={{ color: 'rgba(226,232,240,0.6)' }}>您的密码已更新，请使用新密码登录。</span>}
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
