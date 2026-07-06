import { Modal, Typography, Divider } from 'antd';
import { FileProtectOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface Props {
  open: boolean;
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export default function AgreementModal({ open, type, onClose }: Props) {
  return (
    <Modal
      title={
        type === 'terms'
          ? <span><FileProtectOutlined style={{ marginRight: 8, color: '#1677ff' }} />用户服务协议</span>
          : <span><LockOutlined style={{ marginRight: 8, color: '#52c41a' }} />隐私权政策</span>
      }
      open={open} onCancel={onClose} footer={null} width={640}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: 24 } }}
    >
      {type === 'terms' ? (
        <Typography style={{ lineHeight: 1.8, color: '#444' }}>
          <Title level={4}>一、总则</Title>
          <Paragraph>
            欢迎您使用贝壳统一管理平台（以下简称"本系统"）。本协议是您与本系统开发者之间关于您使用本系统服务所订立的协议。请您仔细阅读本协议的全部内容。
          </Paragraph>

          <Title level={4}>二、账号注册与管理</Title>
          <Paragraph>
            1. 您确认，在您开始注册程序使用本系统服务前，您应当具备中华人民共和国法律规定的与您行为相适应的民事行为能力。<br />
            2. 您应提供真实、准确、完整的注册资料，并在资料发生变更时及时更新。<br />
            3. 您的账号及密码由您自行保管，因您保管不善可能导致遭受盗用或密码泄露，责任由您自行承担。
          </Paragraph>

          <Title level={4}>三、服务使用规范</Title>
          <Paragraph>
            您在使用本系统服务时，必须遵守相关法律法规，不得利用本系统从事任何违法违规活动，不得干扰本系统的正常运行或侵犯其他用户的合法权益。
          </Paragraph>

          <Title level={4}>四、免责声明</Title>
          <Paragraph>
            本系统按"现状"提供服务，不对服务的及时性、安全性、准确性作任何形式的保证。因不可抗力或第三方原因导致的服务中断不承担责任。
          </Paragraph>

          <Divider />
          <Text type="secondary">最后更新日期：2026年7月1日</Text>
        </Typography>
      ) : (
        <Typography style={{ lineHeight: 1.8, color: '#444' }}>
          <Title level={4}>一、我们收集的信息</Title>
          <Paragraph>
            在您使用本系统服务时，我们可能会收集以下信息：<br />
            1. <Text strong>账号信息：</Text>您的注册邮箱、密码（加密存储）。<br />
            2. <Text strong>设备与日志信息：</Text>IP 地址、浏览器类型、访问时间等，用于安全审计和异地登录检测。
          </Paragraph>

          <Title level={4}>二、信息的使用与保护</Title>
          <Paragraph>
            我们承诺采用行业标准安全技术和程序保护您的个人信息不被未经授权的访问、使用或泄露。未经您的同意，我们不会向任何第三方共享、转让您的个人信息，法律法规另有规定的除外。
          </Paragraph>

          <Title level={4}>三、Cookie 的使用</Title>
          <Paragraph>
            为确保网站正常运转，我们会在您的设备上存储 Cookie 文件。借助于 Cookie，网站能够记住您的登录状态，提升使用体验。
          </Paragraph>

          <Divider />
          <Text type="secondary">最后更新日期：2026年7月1日</Text>
        </Typography>
      )}
    </Modal>
  );
}
