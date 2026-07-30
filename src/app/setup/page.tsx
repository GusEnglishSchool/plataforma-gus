"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: "Teacher Gustavo",
        email: email,
        role: "teacher",
        createdAt: new Date().toISOString()
      });

      alert("Conta do Teacher criada com sucesso! Redirecionando pro Login...");
      router.push("/login");
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "4rem", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Criar Conta de Administrador (Teacher)</h2>
      <p>Use esta página apenas uma vez para criar seu acesso principal.</p>
      <form onSubmit={handleCreateTeacher} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "10px" }} />
        <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ padding: "10px" }} />
        <button type="submit" disabled={loading} style={{ padding: "10px", background: "blue", color: "white" }}>Criar Conta</button>
      </form>
    </div>
  );
}
