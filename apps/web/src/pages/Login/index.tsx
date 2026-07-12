import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../store/useTheme";
import { App } from "antd";
import { Eye, EyeOff, Sun } from "lucide-react";
import Logo from "../../components/ui/Logo";
import RegisterForm from "./RegisterForm";
import ForgotPassword from "./ForgotPassword";
import AgreementModal from "./AgreementModal";

// ============================================================
// 动画角色子组件（Pupil / EyeBall）— 完整保留
// ============================================================

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }: PupilProps) {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const pupilPosition = (() => {
    try {
      if (!pupilRef.current) return { x: 0, y: 0 };
      if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
      const r = pupilRef.current.getBoundingClientRect();
      if (!r) return { x: 0, y: 0 };
      const dx = mouseX - (r.left + r.width / 2), dy = mouseY - (r.top + r.height / 2);
      const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
      const a = Math.atan2(dy, dx);
      return { x: Math.cos(a) * d, y: Math.sin(a) * d };
    } catch { return { x: 0, y: 0 }; }
  })();

  return (
    <div ref={pupilRef} className="rounded-full" style={{
      width: size, height: size, backgroundColor: pupilColor,
      transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
      transition: "transform 0.1s ease-out",
    }} />
  );
}

interface EyeBallProps {
  size?: number; pupilSize?: number; maxDistance?: number;
  eyeColor?: string; pupilColor?: string; isBlinking?: boolean;
  forceLookX?: number; forceLookY?: number;
}

function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY }: EyeBallProps) {
  const [mouseX, setMouseX] = useState(0); const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const pupilPos = (() => {
    try {
      if (!eyeRef.current) return { x: 0, y: 0 };
      if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
      const r = eyeRef.current.getBoundingClientRect();
      if (!r) return { x: 0, y: 0 };
      const dx = mouseX - (r.left + r.width / 2), dy = mouseY - (r.top + r.height / 2);
      const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
      const a = Math.atan2(dy, dx);
      return { x: Math.cos(a) * d, y: Math.sin(a) * d };
    } catch { return { x: 0, y: 0 }; }
  })();

  return (
    <div ref={eyeRef} className="rounded-full flex items-center justify-center transition-all duration-150" style={{
      width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: "hidden",
    }}>
      {!isBlinking && (
        <div className="rounded-full" style={{
          width: pupilSize, height: pupilSize, backgroundColor: pupilColor,
          transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)`,
          transition: "transform 0.1s ease-out",
        }} />
      )}
    </div>
  );
}

// ============================================================
// 登录页主组件 – 接入真实 auth 系统（逻辑完整保留，视觉重构）
// ============================================================

export default function LoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth(s => s.login);
  const isLoggedIn = useAuth(s => s.isLoggedIn);
  const { toggleTheme } = useTheme();

  const redirectUrl = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // 注册 / 忘记密码 / 协议
  const [isRegister, setIsRegister] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [agreementType, setAgreementType] = useState<"terms" | "privacy" | null>(null);

  // 动画状态
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  // 已登录直接跳转
  useEffect(() => { if (isLoggedIn) navigate("/", { replace: true }); }, [isLoggedIn, navigate]);

  // 登录页强制深色沉浸 — 锁定 body 深色 + html.dark，离开后恢复
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevBodyBg = body.style.background;
    body.style.background = '#070a14';
    html.classList.add('dark');
    return () => {
      body.style.background = prevBodyBg;
      html.classList.remove('dark');
    };
  }, []);

  // 鼠标跟踪
  useEffect(() => {
    const h = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // 紫色角色随机眨眼
  useEffect(() => {
    const schedule = () => setTimeout(() => {
      setIsPurpleBlinking(true);
      setTimeout(() => { setIsPurpleBlinking(false); schedule(); }, 150);
    }, Math.random() * 4000 + 3000);
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // 黑色角色随机眨眼
  useEffect(() => {
    const schedule = () => setTimeout(() => {
      setIsBlackBlinking(true);
      setTimeout(() => { setIsBlackBlinking(false); schedule(); }, 150);
    }, Math.random() * 4000 + 3000);
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // 输入时互相对视
  useEffect(() => {
    if (isTyping) { setIsLookingAtEachOther(true); const t = setTimeout(() => setIsLookingAtEachOther(false), 800); return () => clearTimeout(t); }
    else setIsLookingAtEachOther(false);
  }, [isTyping]);

  // 密码可见时偷看
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const peek = () => setTimeout(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      const t = peek();
      return () => clearTimeout(t);
    } else setIsPurplePeeking(false);
  }, [password, showPassword]);

  // 计算角色位置（try-catch 兜底 React 19 并发模式下 DOM 瞬时分离）
  const calc = (ref: React.RefObject<HTMLDivElement | null>) => {
    try {
      if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
      const r = ref.current.getBoundingClientRect();
      if (!r) return { faceX: 0, faceY: 0, bodySkew: 0 };
      const cX = r.left + r.width / 2, cY = r.top + r.height / 3;
      return {
        faceX: Math.max(-15, Math.min(15, (mouseX - cX) / 20)),
        faceY: Math.max(-10, Math.min(10, (mouseY - cY) / 30)),
        bodySkew: Math.max(-6, Math.min(6, -(mouseX - cX) / 120)),
      };
    } catch { return { faceX: 0, faceY: 0, bodySkew: 0 }; }
  };
  const purplePos = calc(purpleRef), blackPos = calc(blackRef);
  const yellowPos = calc(yellowRef), orangePos = calc(orangeRef);

  // 登录提交 — 对接真实 auth
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("请输入用户名或邮箱"); return; }
    if (password.length < 6) { setError("密码至少 6 位"); return; }
    setIsLoading(true);
    const result = await login(email.trim(), password, remember);
    setIsLoading(false);
    if (result.success) {
      message.success("登录成功");
      setIsExiting(true);
      setTimeout(() => navigate(redirectUrl, { replace: true }), 800);
    } else {
      setError(result.msg || "登录失败，请检查账号密码");
    }
  }, [email, password, remember, login, message, navigate, redirectUrl]);

  return (
    <div className="auth-page min-h-screen grid lg:grid-cols-2">
      {/* 景深光斑层 */}
      <div className="auth-blob auth-blob--blue" />
      <div className="auth-blob auth-blob--cyan" />
      <div className="auth-blob auth-blob--violet" />
      <div className="auth-blob auth-blob--ember" />
      <div className="auth-grain" />
      <div className="auth-bridge" />

      {/* 主题切换按钮 */}
      <button onClick={toggleTheme} aria-label="切换主题"
        className="absolute top-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(12px)", color: "#e2e8f0" }}>
        <Sun className="size-5" />
      </button>

      {/* 左侧 — 品牌区 + 动画角色（完整保留） */}
      <div className={`hidden lg:flex flex-col justify-between p-12 relative z-20 ${isExiting ? "login-exit-left" : ""}`}>
        <div className="relative z-20">
          <Logo size={36} forceLight />
        </div>

        {/* 四色动画角色 */}
        <div className="relative z-20 flex items-end justify-center h-[460px] mt-[-40px]">
          <div className="relative" style={{ width: 550, height: 400 }}>
            {/* 角色脚下光晕 — 空间感 */}
            <div className="auth-stage-glow" />
            {/* Purple */}
            <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: 70, width: 180, height: isTyping || (password.length > 0 && !showPassword) ? 440 : 400, backgroundColor: "#6C3FF5", borderRadius: "10px 10px 0 0", zIndex: 1,
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{ left: (password.length > 0 && showPassword) ? 20 : isLookingAtEachOther ? 55 : 45 + purplePos.faceX, top: (password.length > 0 && showPassword) ? 35 : isLookingAtEachOther ? 65 : 40 + purplePos.faceY }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking}
                  forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking}
                  forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>
            {/* Black */}
            <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: 240, width: 120, height: 310, backgroundColor: "#2D2D2D", borderRadius: "8px 8px 0 0", zIndex: 2,
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" : isLookingAtEachOther ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)` : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{ left: (password.length > 0 && showPassword) ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX, top: (password.length > 0 && showPassword) ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking}
                  forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking}
                  forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>
            {/* Orange */}
            <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: 0, width: 240, height: 200, zIndex: 3, backgroundColor: "#FF9B6B", borderRadius: "120px 120px 0 0",
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" : `skewX(${orangePos.bodySkew || 0}deg)`, transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{ left: (password.length > 0 && showPassword) ? 50 : 82 + (orangePos.faceX || 0), top: (password.length > 0 && showPassword) ? 85 : 90 + (orangePos.faceY || 0) }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
              </div>
            </div>
            {/* Yellow */}
            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: 310, width: 140, height: 230, backgroundColor: "#E8D754", borderRadius: "70px 70px 0 0", zIndex: 4,
                transform: (password.length > 0 && showPassword) ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`, transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{ left: (password.length > 0 && showPassword) ? 20 : 52 + (yellowPos.faceX || 0), top: (password.length > 0 && showPassword) ? 35 : 40 + (yellowPos.faceY || 0) }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
              </div>
              <div className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{ left: (password.length > 0 && showPassword) ? 10 : 40 + (yellowPos.faceX || 0), top: (password.length > 0 && showPassword) ? 88 : 88 + (yellowPos.faceY || 0) }} />
            </div>
          </div>
        </div>

        <div className="relative z-20 text-sm" style={{ color: "rgba(226,232,240,0.5)", letterSpacing: "0.04em" }}>
          LTC 线索 · 项目一体化管理 · 线索攻坚战
        </div>
      </div>

      {/* 右侧 — 登录/注册表单（玻璃面板） */}
      <div className={`flex items-center justify-center p-6 md:p-8 relative z-20 ${isExiting ? "login-exit-right" : ""}`}>
        <div className="auth-glass auth-form-in w-full max-w-[420px] p-8 md:p-10">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Logo size={30} forceLight />
          </div>

          {isRegister ? (
            <>
              <div className="mb-6">
                <h1 className="auth-title text-[26px]" style={{ color: "#f1f5f9" }}>创建新账号</h1>
                <p className="auth-subtitle text-sm mt-2" style={{ color: "rgba(226,232,240,0.55)" }}>加入贝壳统一管理平台</p>
              </div>
              <RegisterForm
                onSuccess={() => { setIsRegister(false); message.success("注册成功，请登录"); }}
                onBack={() => setIsRegister(false)} />
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="auth-title text-[28px]" style={{ color: "#f1f5f9" }}>欢迎回来</h1>
                <p className="auth-subtitle text-sm mt-2" style={{ color: "rgba(226,232,240,0.55)" }}>请输入账号信息登录</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 auth-field">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium" style={{ color: "rgba(226,232,240,0.72)" }}>用户名 / 邮箱</Label>
                  <Input id="email" type="text" placeholder="admin" value={email} autoComplete="username"
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                    required className="h-12 rounded-xl border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-400/40 focus-visible:ring-0 focus-visible:border-blue-400/60 focus-visible:bg-white/10" />
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="password" className="text-sm font-medium" style={{ color: "rgba(226,232,240,0.72)" }}>密码</Label>
                  {/* type 动态切换：showPassword 时 text，否则 password；由 CSS 隐藏浏览器内置 reveal 按钮 */}
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    required
                    className="pr-12 h-12 rounded-xl border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-400/40 focus-visible:ring-0 focus-visible:border-blue-400/60 focus-visible:bg-white/10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 bottom-0 h-12 w-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors rounded-lg"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}>
                    {showPassword ? <EyeOff className="size-[18px] shrink-0" /> : <Eye className="size-[18px] shrink-0" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                    <Label htmlFor="remember" className="text-xs font-normal cursor-pointer" style={{ color: "rgba(226,232,240,0.6)" }}>保持登录（30天）</Label>
                  </div>
                  <a className="auth-link text-xs" onClick={() => setForgotOpen(true)}>忘记密码？</a>
                </div>

                {error && (
                  <div className="p-3 text-sm rounded-xl"
                    style={{ color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    {error}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox id="agreed" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                  <Label htmlFor="agreed" className="text-xs font-normal cursor-pointer" style={{ color: "rgba(226,232,240,0.6)" }}>
                    登录即表示同意
                    <a className="auth-link text-xs mx-1" onClick={() => setAgreementType("terms")}>《用户协议》</a>
                    和
                    <a className="auth-link text-xs mx-1" onClick={() => setAgreementType("privacy")}>《隐私政策》</a>
                  </Label>
                </div>

                <Button type="submit" className="auth-btn w-full text-base" size="lg" disabled={isLoading || !agreed}>
                  {isLoading ? "登录中..." : "登 录"}
                </Button>
              </form>

              <div className="text-center mt-6">
                <span className="text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>还没有账号？</span>
                <a className="auth-link text-sm ml-1 font-medium" onClick={() => setIsRegister(true)}>立即注册</a>
              </div>

              {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true') && (
                <div className="text-center text-xs mt-4" style={{ color: "rgba(226,232,240,0.38)" }}>
                  演示账号：admin / admin123
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ForgotPassword open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <AgreementModal open={!!agreementType} type={agreementType!} onClose={() => setAgreementType(null)} />
    </div>
  );
}
