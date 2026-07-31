"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user is teacher or student
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data().role === "teacher") {
        router.push("/teacher");
      } else {
        // Se não tiver doc ou role for student, verifica status
        const status = userDoc.exists() ? userDoc.data().status : 'pending';
        if (status === 'pending') {
          // Force pending users to dashboard where they will see the blocked screen
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
      
    } catch (err: any) {
      console.error(err);
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document with pending status
        await setDoc(userDocRef, {
          name: user.displayName || "Aluno",
          email: user.email,
          role: "student",
          status: "pending",
          createdAt: new Date().toISOString()
        });
        router.push("/dashboard");
      } else {
        if (userDoc.data().role === "teacher") {
          router.push("/teacher");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro ao fazer login com o Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor, digite seu email primeiro.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Erro ao enviar email de recuperação.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Image src="/logo.png" alt="Gus English School Logo" width={80} height={80} style={{ objectFit: 'contain' }} />
          <h1 style={{ marginTop: "1rem", color: "var(--primary-blue)" }}>Área do Aluno</h1>
          <p>Faça login para acessar suas aulas e materiais</p>
        </div>

        {error && <div style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>{error}</div>}
        {resetSent && <div style={{ color: "green", textAlign: "center", marginBottom: "1rem" }}>Email de recuperação enviado! Verifique sua caixa de entrada.</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com"
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Sua senha"
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button 
            type="button" 
            onClick={handleForgotPassword} 
            style={{ background: "none", border: "none", color: "var(--secondary-blue)", textDecoration: "underline", cursor: "pointer", fontSize: "0.9rem" }}
          >
            Esqueci minha senha
          </button>
        </div>

        <div style={{ marginTop: "2rem", borderTop: "1px solid #eee", paddingTop: "2rem" }}>
          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            className="btn-primary" 
            style={{ width: "100%", background: "white", color: "#333", border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            disabled={loading}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} />
            Continuar com Google
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/" style={{ color: "var(--secondary-blue)", textDecoration: "underline" }}>
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}
