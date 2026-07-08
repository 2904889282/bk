import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../store/useTheme";
import { App } from "antd";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import Logo from "../../components/ui/Logo";
import RegisterForm from "./RegisterForm";
import ForgotPassword from "./ForgotPassword";
import AgreementModal from "./AgreementModal";

// ============================================================
// 动画角色子组件（Pupil / EyeBall）
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
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = pupilRef.current.getBoundingClientRect();
    const dx = mouseX - (r.left + r.width / 2), dy = mouseY - (r.top + r.height / 2);
    const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
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
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = eyeRef.current.getBoundingClientRect();
    const dx = mouseX - (r.left + r.width / 2), dy = mouseY - (r.top + r.height / 2);
    const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
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
// 登录页主组件 – 接入真实 auth 系统
// ============================================================

export default function LoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth(s => s.login);
  const isLoggedIn = useAuth(s => s.isLoggedIn);
  const { isDark, toggleTheme } = useTheme();

  const redirectUrl = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  // 计算角色位置
  const calc = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cX = r.left + r.width / 2, cY = r.top + r.height / 3;
    return {
      faceX: Math.max(-15, Math.min(15, (mouseX - cX) / 20)),
      faceY: Math.max(-10, Math.min(10, (mouseY - cY) / 30)),
      bodySkew: Math.max(-6, Math.min(6, -(mouseX - cX) / 120)),
    };
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
    const result = await login(email.trim(), password, true);
    setIsLoading(false);
    if (result.success) {
      message.success("登录成功");
      setIsExiting(true);
      setTimeout(() => navigate(redirectUrl, { replace: true }), 800);
    } else {
      setError(result.msg || "登录失败，请检查账号密码");
    }
  }, [email, password, login, message, navigate, redirectUrl]);

  // 主题色
  const darkBg = "#0f172a";
  const leftGradient = isDark
    ? "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)"
    : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)";

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: isDark ? darkBg : "#f1f5f9", position: "relative", overflow: "hidden" }}>
      {/* 主题切换按钮 */}
      <button onClick={toggleTheme} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
        {isDark ? <Sun className="size-5 text-yellow-400" /> : <Moon className="size-5 text-slate-600" />}
      </button>

      {/* 左侧 — 品牌区 + 动画角色 */}
      <div className={`hidden lg:flex flex-col justify-between p-12 ${isExiting ? "login-exit-left" : ""}`} style={{ background: leftGradient, color: "#fff" }}>
        <div className="relative z-20">
          <Logo size={36} forceLight />
        </div>

        {/* 四色动画角色 */}
        <div className="relative z-20 flex items-end justify-center h-[460px] mt-[-40px]">
          <div className="relative" style={{ width: 550, height: 400 }}>
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

        <div className="relative z-20 text-sm opacity-60">
          LTC 线索 · 项目一体化管理 · 线索攻坚战
        </div>
      </div>

      {/* 右侧 — 登录/注册表单 */}
      <div className={`flex items-center justify-center p-8 ${isExiting ? "login-exit-right" : ""}`}>
        <div className="w-full max-w-[400px]">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-10">
            <span>贝壳管理平台</span>
          </div>

          {isRegister ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>创建新账号</h1>
                <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>加入贝壳统一管理平台</p>
              </div>
              <RegisterForm
                onSuccess={() => { setIsRegister(false); message.success("注册成功，请登录"); }}
                onBack={() => setIsRegister(false)} />
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>欢迎回来</h1>
                <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>请输入账号信息</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">用户名 / 邮箱</Label>
                  <Input id="email" type="text" placeholder="admin" value={email} autoComplete="username"
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                    required className="h-11" />
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    required className="h-11 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 bottom-0 h-11 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" defaultChecked />
                    <Label htmlFor="remember" className="text-xs font-normal cursor-pointer">保持登录（30天）</Label>
                  </div>
                  <a className="text-xs hover:underline cursor-pointer" style={{ color: "var(--color-primary)" }}
                    onClick={() => setForgotOpen(true)}>忘记密码？</a>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-900/30">
                    {error}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox id="agreed" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                  <Label htmlFor="agreed" className="text-xs font-normal cursor-pointer">
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>登录即表示同意</span>
                    <a className="text-xs mx-1 cursor-pointer" onClick={() => setAgreementType("terms")}>《用户协议》</a>
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>和</span>
                    <a className="text-xs mx-1 cursor-pointer" onClick={() => setAgreementType("privacy")}>《隐私政策》</a>
                  </Label>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-medium" size="lg" disabled={isLoading}>
                  {isLoading ? "登录中..." : "登 录"}
                </Button>
              </form>

              <div className="text-center mt-6">
                <span className="text-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>还没有账号？</span>
                <a className="text-sm ml-1 cursor-pointer font-medium hover:underline" style={{ color: "var(--color-primary)" }}
                  onClick={() => setIsRegister(true)}>立即注册</a>
              </div>

              <div className="text-center text-xs mt-4" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                演示账号：admin / admin123 · zhangming / zm2026
              </div>
            </>
          )}
        </div>
      </div>

      <ForgotPassword open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <AgreementModal open={!!agreementType} type={agreementType!} onClose={() => setAgreementType(null)} />
    </div>
  );
}
