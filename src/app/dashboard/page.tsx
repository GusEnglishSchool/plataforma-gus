"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, addDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';
import VideoRoom from '@/components/VideoRoom';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inicio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [studentDocId, setStudentDocId] = useState<string>("");
  const [teacherUid, setTeacherUid] = useState<string>("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [newGlobalMessage, setNewGlobalMessage] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<any>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const [globalRoomOpen, setGlobalRoomOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch Teacher UID Once & All Users map
  useEffect(() => {
     const unsubSettings = onSnapshot(doc(db, "settings", "active_teacher"), (docSnap) => {
       if (docSnap.exists()) {
          setTeacherUid(docSnap.data().uid);
       } else {
          getDocs(query(collection(db, "users"), where("role", "==", "teacher"))).then(snap => {
            if(!snap.empty) setTeacherUid(snap.docs[0].data().uid);
          });
       }
     });

     const unsubAllUsers = onSnapshot(collection(db, "users"), (snap) => {
         const users: any[] = [];
         snap.forEach(d => users.push(d.data()));
         setAllUsers(users);
     });

     return () => { unsubSettings(); unsubAllUsers(); };
  }, []);

  // Global Listeners
  useEffect(() => {
    if (!user) return;

    getDocs(query(collection(db, "users"), where("uid", "==", user.uid))).then(snap => {
      if(!snap.empty) setStudentDocId(snap.docs[0].id);
    });

    const qTasks = query(collection(db, "tasks"), where("studentId", "==", user.uid));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(data);
    });

    const qMaterials = query(collection(db, "materials"), where("studentId", "==", user.uid));
    const unsubMaterials = onSnapshot(qMaterials, (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMaterials(data);
    });

    const qEvents = query(collection(db, "calendar"), where("studentId", "==", user.uid));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const data: any[] = [];
      snap.forEach(d => {
        const ev = d.data();
        data.push({ id: d.id, title: ev.title, start: new Date(ev.start), end: new Date(ev.end), link: ev.link });
      });
      setEvents(data);
    });

    const qGlobalChat = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubGlobalChat = onSnapshot(qGlobalChat, (snap) => {
      const data: any[] = [];
      snap.forEach(d => {
        if (d.data().type === "global" || !d.data().type) {
          data.push({ id: d.id, ...d.data() });
        }
      });
      setGlobalMessages(data);
      setTimeout(scrollToBottom, 100);
    });

    const qMyDoc = query(collection(db, "users"), where("uid", "==", user.uid));
    let initialUserLoad = true;
    const unsubUserDoc = onSnapshot(qMyDoc, (snap) => {
      if(!snap.empty) {
         const me = snap.docs[0].data();
         setUserProfile(me);
         setHasUnread(!!me.hasUnreadForStudent);
         
         if(!initialUserLoad && me.hasUnreadForStudent) {
            audioRef.current?.play().catch(() => {});
            toast('O Teacher mandou uma mensagem!', { icon: '🧑‍🏫' });
         }
      }
      initialUserLoad = false;
    });

    const qAssessments = query(collection(db, "assessments"), where("studentId", "==", user.uid));
    const unsubAssessments = onSnapshot(qAssessments, (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAssessments(data);
    }, (error) => {
      console.error("Erro nas avaliações:", error);
    });

    const unsubGlobalRoom = onSnapshot(doc(db, "settings", "global_room"), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalRoomOpen(docSnap.data().isOpen);
      }
    });

    return () => { unsubTasks(); unsubMaterials(); unsubEvents(); unsubGlobalChat(); unsubUserDoc(); unsubAssessments(); unsubGlobalRoom(); };
  }, [user]);

  // Private Chat Listener
  useEffect(() => {
     if (!user || !teacherUid) return;
     const chatId = [teacherUid, user.uid].sort().join("_");
     const qMessages = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
     
     const unsubPrivateMessages = onSnapshot(qMessages, (msgSnap) => {
       const mData: any[] = [];
       msgSnap.forEach(d => mData.push({ id: d.id, ...d.data() }));
       setPrivateMessages(mData);
       setTimeout(scrollToBottom, 100);
     });

     return () => unsubPrivateMessages();
  }, [user, teacherUid]);

  useEffect(() => {
     if (activeTab === "chat-private" && hasUnread && studentDocId) {
        updateDoc(doc(db, "users", studentDocId), { hasUnreadForStudent: false });
     }
  }, [activeTab, hasUnread, studentDocId]);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "tasks", taskId), { completed: !currentStatus });
    if (!currentStatus) toast.success("Tarefa concluída!");
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment) return;
    
    // Check if all questions are answered
    for (const q of activeAssessment.questions) {
      const ans = assessmentAnswers[q.id];
      if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'object' && Object.keys(ans).length === 0)) {
        return toast.error("Por favor, responda todas as questões antes de enviar.");
      }
    }

    try {
      await updateDoc(doc(db, "assessments", activeAssessment.id), {
        status: 'Entregue',
        studentResponses: assessmentAnswers,
        submittedAt: new Date().toISOString()
      });
      toast.success("Avaliação enviada com sucesso!");
      setActiveAssessment(null);
      setAssessmentAnswers({});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendPrivateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrivateMessage.trim() || !user || !studentDocId || !teacherUid) return;
    
    const chatId = [teacherUid, user.uid].sort().join("_");
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newPrivateMessage,
      senderName: userProfile?.name || user.email.split('@')[0],
      senderId: user.uid,
      createdAt: new Date().toISOString()
    });
    
    await updateDoc(doc(db, "users", studentDocId), { hasUnreadForTeacher: true });
    setNewPrivateMessage("");
  };

  const handleSendGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlobalMessage.trim() || !user) return;
    
    await addDoc(collection(db, "messages"), {
      text: newGlobalMessage,
      senderName: userProfile?.name || user.email.split('@')[0],
      senderId: user.uid,
      createdAt: new Date().toISOString()
    });
    setNewGlobalMessage("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !studentDocId) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        updateDoc(doc(db, "users", studentDocId), { photoURL: dataUrl });
        toast.success("Foto de perfil atualizada!");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!user) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Carregando...</div>;

  if (userProfile?.status === "pending") {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', textAlign: 'center', padding: '2rem' }}>
        <Image src="/logo.png" alt="Logo" width={100} height={100} style={{ marginBottom: '1rem' }} />
        <h1 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>Aguardando Liberação</h1>
        <p style={{ color: '#666', maxWidth: '500px', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Sua conta foi criada com sucesso! No entanto, o Teacher Gus precisa aprovar o seu acesso manualmente. Por favor, aguarde a liberação.
        </p>
        <button onClick={() => {signOut(auth); router.push("/");}} className="btn-secondary">Voltar ao Início</button>
      </div>
    );
  }
  const isHotmart = userProfile?.modality === 'Hotmart';
  const isParticular = userProfile?.modality === 'Particular' || !userProfile?.modality; // Fallback
  const pkg = userProfile?.package;

  const showCalendar = isParticular || (isHotmart && (pkg === 'English Evolution' || pkg === 'Becoming Fluent'));
  const showMaterials = isParticular;
  const showTeacherChat = isParticular || (isHotmart && pkg === 'Becoming Fluent');
  const canChatGlobal = isParticular || (isHotmart && (pkg === 'English Evolution' || pkg === 'Becoming Fluent'));

  const filteredMaterials = materials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="dashboard-layout">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <h2>Gus School</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "inicio" ? "active" : ""}`} onClick={() => {setActiveTab("inicio"); setIsSidebarOpen(false);}}>Dashboard</button>
          {showCalendar && <button className={`nav-item ${activeTab === "calendario" ? "active" : ""}`} onClick={() => {setActiveTab("calendario"); setIsSidebarOpen(false);}}>Meu Calendário</button>}
          {showMaterials && <button className={`nav-item ${activeTab === "materiais" ? "active" : ""}`} onClick={() => {setActiveTab("materiais"); setIsSidebarOpen(false);}}>Meus Materiais</button>}
          {isParticular && <button className={`nav-item ${activeTab === "avaliacoes" ? "active" : ""}`} onClick={() => {setActiveTab("avaliacoes"); setIsSidebarOpen(false);}}>Avaliações</button>}
          {showTeacherChat && (
            <button className={`nav-item ${activeTab === "chat-private" ? "active" : ""}`} onClick={() => {setActiveTab("chat-private"); setIsSidebarOpen(false);}} style={{position: 'relative'}}>
              Chat com Teacher
              {hasUnread && activeTab !== "chat-private" && <span style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', width:'10px', height:'10px', borderRadius:'50%', background:'red'}}></span>}
            </button>
          )}
          {userProfile?.isPrivateRoomOpen && isParticular && (
            <button className={`nav-item ${activeTab === "aula-particular" ? "active" : ""}`} onClick={() => {setActiveTab("aula-particular"); setIsSidebarOpen(false);}} style={{ color: 'var(--accent-gold)' }}>
              🎥 Aula Particular
            </button>
          )}
          <button className={`nav-item ${activeTab === "chat-global" ? "active" : ""}`} onClick={() => {setActiveTab("chat-global"); setIsSidebarOpen(false);}} style={{position: 'relative'}}>
            Chat da Turma
          </button>
          {globalRoomOpen && (
            <button className="nav-item" onClick={() => {window.open("https://meet.jit.si/GusEnglishSchool", "_blank"); setIsSidebarOpen(false);}} style={{ color: 'var(--accent-gold)' }}>
              🎥 Live da Turma
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => {signOut(auth); router.push("/");}} className="btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>Sair</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="content-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="mobile-sidebar-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h1>
            {activeTab === "inicio" && "Bem-vindo de volta!"}
            {activeTab === "calendario" && "Sua Agenda de Aulas"}
            {activeTab === "materiais" && "Lições e PDFs"}
            {activeTab === "chat-private" && "Fale com o Teacher"}
            {activeTab === "chat-global" && "Interação da Turma"}
            {activeTab === "aula-particular" && "Aula Ao Vivo"}
            {activeTab === "sala-global" && "Live da Turma"}
          </h1>
          </div>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{fontWeight: 'bold', color: 'var(--primary-blue)'}}>{userProfile?.name || 'Aluno(a)'}</span>
            <label style={{ cursor: 'pointer', position: 'relative' }} title="Clique para alterar a foto">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }} />
              ) : (
                <div className="avatar" style={{ width: '45px', height: '45px', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
                  {userProfile?.name?.charAt(0) || 'A'}
                </div>
              )}
              <div style={{position: 'absolute', bottom: '-5px', right: '-5px', background: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', fontSize: '10px'}}>📷</div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
          </div>
        </header>

        <div className="content-body">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              
              {activeTab === "inicio" && (
                <div className="card">
                  <h3 style={{fontSize:'1.5rem', marginBottom:'1.5rem'}}>Suas Tarefas</h3>
                  {tasks.length === 0 ? (
                    <p style={{color:'#666'}}>Você não possui tarefas no momento.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {tasks.map(t => (
                        <motion.div whileHover={{scale:1.01}} key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', background: t.completed ? '#e8f5e9' : 'var(--bg-color)', borderRadius: '12px', opacity: t.completed ? 0.6 : 1, transition: 'all 0.3s' }}>
                          <input type="checkbox" checked={t.completed} onChange={() => handleToggleTask(t.id, t.completed)} style={{ width: '24px', height: '24px', cursor:'pointer' }} />
                          <div style={{flex:1}}>
                            <span style={{ fontSize: '1.1rem', textDecoration: t.completed ? 'line-through' : 'none', fontWeight:'500', color:'var(--primary-blue)' }}>{t.description}</span>
                            <p style={{margin:0, fontSize:'0.8rem', color:'#666'}}>Atribuída em {moment(t.createdAt).format('DD/MM/YYYY')}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "calendario" && (
                <div className="card">
                  <div style={{height: '600px'}}>
                    <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" messages={{ next: "Próx", previous: "Ant", today: "Hoje", month: "Mês", week: "Semana", day: "Dia" }} onSelectEvent={(event: any) => { if(event.link) window.open(event.link, "_blank"); else toast(event.title, { icon: 'ℹ️' }); }} />
                  </div>
                </div>
              )}

              {activeTab === "materiais" && (
                <div className="card">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem'}}>
                    <h3 style={{margin:0}}>Sua Biblioteca</h3>
                    <input type="text" placeholder="Pesquisar material..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{padding:'10px 15px', borderRadius:'30px', border:'1px solid #ccc', width:'300px'}}/>
                  </div>
                  
                  {filteredMaterials.length === 0 ? (
                    <p style={{color:'#666'}}>Nenhum material encontrado.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                      {filteredMaterials.map(m => (
                        <motion.a whileHover={{y:-5}} href={m.url} target="_blank" key={m.id} style={{ display:'block', padding: '1.5rem', background:'var(--bg-color)', borderRadius:'12px', textDecoration:'none', border:'1px solid #e2e8f0' }}>
                          <div style={{fontSize:'2rem', marginBottom:'10px'}}>📄</div>
                          <div style={{ color: 'var(--primary-blue)', fontWeight: 'bold', fontSize: '1.1rem' }}>{m.title}</div>
                          <div style={{fontSize:'0.8rem', color:'#666', marginTop:'10px'}}>Enviado: {moment(m.createdAt).format('DD/MM/YYYY')}</div>
                        </motion.a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "avaliacoes" && isParticular && (
                <div className="card">
                  {activeAssessment ? (
                    <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <button onClick={() => setActiveAssessment(null)} style={{ color: 'var(--secondary-blue)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>← Voltar</button>
                      <h2 style={{ color: 'var(--primary-blue)', margin: '0 0 10px 0' }}>{activeAssessment.title}</h2>
                      <div style={{ display: 'flex', gap: '15px', color: '#666', marginBottom: '2rem' }}>
                        <span>{activeAssessment.isGraded ? '⭐ Vale Nota' : 'Sem Nota'}</span>
                        {activeAssessment.dueDate && <span>📅 Entrega: {moment(activeAssessment.dueDate).format('DD/MM/YYYY')}</span>}
                      </div>

                      <form onSubmit={handleSubmitAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {activeAssessment.questions.map((q: any, index: number) => (
                          <div key={q.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                              {(() => {
                                const formattedNum = q.number ? (q.number.trim().match(/[.)-]$/) ? q.number.trim() : q.number.trim() + ')') : `${index + 1})`;
                                return (
                                  <>
                                    {q.instruction && (
                                      <h3 style={{ fontSize: '1.2rem', marginBottom: q.prompt ? '10px' : '0', color: 'var(--primary-blue)' }}>
                                        {formattedNum} {q.instruction} {!q.prompt && <span style={{color:'red'}}>*</span>}
                                      </h3>
                                    )}
                                    {q.prompt && (
                                      <div style={{ fontWeight: q.instruction ? 'normal' : 'bold', fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>
                                        {!q.instruction && <strong>{formattedNum} </strong>}
                                        {q.type !== 'fill_in_the_blanks' && q.type !== 'inline_dropdown' && (
                                          <span>{q.prompt} <span style={{color:'red'}}>*</span></span>
                                        )}
                                        {(q.type === 'fill_in_the_blanks' || q.type === 'inline_dropdown') && !q.instruction && (
                                          <span style={{color:'red'}}>*</span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            
                            {q.type === 'short_answer' && (
                              <input type="text" required value={assessmentAnswers[q.id] || ''} onChange={e => setAssessmentAnswers({...assessmentAnswers, [q.id]: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                            )}
                            
                            {q.type === 'paragraph' && (
                              <textarea required rows={4} value={assessmentAnswers[q.id] || ''} onChange={e => setAssessmentAnswers({...assessmentAnswers, [q.id]: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                            )}

                            {q.type === 'multiple_choice' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {q.options.map((opt: string, optIndex: number) => (
                                  <label key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="radio" required name={q.id} value={opt} checked={assessmentAnswers[q.id] === opt} onChange={e => setAssessmentAnswers({...assessmentAnswers, [q.id]: e.target.value})} style={{ width: '18px', height: '18px' }} />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}

                            {q.type === 'checkboxes' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {q.options.map((opt: string, optIndex: number) => {
                                  const currentAns = assessmentAnswers[q.id] || [];
                                  return (
                                    <label key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                      <input type="checkbox" value={opt} checked={currentAns.includes(opt)} onChange={e => {
                                        const newAns = e.target.checked ? [...currentAns, opt] : currentAns.filter((a: string) => a !== opt);
                                        setAssessmentAnswers({...assessmentAnswers, [q.id]: newAns});
                                      }} style={{ width: '18px', height: '18px' }} />
                                      {opt}
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {q.type === 'fill_in_the_blanks' && (
                              <div style={{ lineHeight: '2' }}>
                                {q.prompt?.split('___').map((part: string, i: number, arr: any[]) => (
                                  <React.Fragment key={i}>
                                    <span style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
                                    {i < arr.length - 1 && (
                                      <input type="text" required value={assessmentAnswers[q.id]?.[i] || ''} onChange={e => {
                                        const currentAns = assessmentAnswers[q.id] || {};
                                        setAssessmentAnswers({...assessmentAnswers, [q.id]: {...currentAns, [i]: e.target.value}});
                                      }} style={{ width: '80px', padding: '5px', margin: '0 5px', border: 'none', borderBottom: '2px solid var(--primary-blue)', outline: 'none', textAlign: 'center', background: 'transparent' }} />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            )}

                            {q.type === 'inline_dropdown' && (
                              <div style={{ lineHeight: '2' }}>
                                {q.prompt.split(/(\[.*?\])/g).map((part: string, i: number) => {
                                  if (part.startsWith('[') && part.endsWith(']')) {
                                    const options = part.slice(1, -1).split('/');
                                    return (
                                      <select required key={i} value={assessmentAnswers[q.id]?.[i] || ''} onChange={e => {
                                        const currentAns = assessmentAnswers[q.id] || {};
                                        setAssessmentAnswers({...assessmentAnswers, [q.id]: {...currentAns, [i]: e.target.value}});
                                      }} style={{ padding: '5px', margin: '0 5px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', background: 'white' }}>
                                        <option value="">Selecione...</option>
                                        {options.map((o: string, oIdx: number) => <option key={oIdx} value={o.trim()}>{o.trim()}</option>)}
                                      </select>
                                    );
                                  }
                                  return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
                                })}
                              </div>
                            )}

                            {q.type === 'match_columns' && (
                              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                  {q.leftOptions?.map((opt: string, optIndex: number) => (
                                    <div key={optIndex} style={{ padding: '10px', background: '#f1f5f9', marginBottom: '8px', borderRadius: '8px', fontWeight: 'bold' }}>
                                      {optIndex + 1}. {opt}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                  {q.rightOptions?.map((opt: string, optIndex: number) => (
                                    <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8fafc', marginBottom: '8px', borderRadius: '8px' }}>
                                      <span>(</span>
                                      <input type="number" min={1} max={q.leftOptions?.length || 99} required value={assessmentAnswers[q.id]?.[optIndex] || ''} onChange={e => {
                                        const currentAns = assessmentAnswers[q.id] || {};
                                        setAssessmentAnswers({...assessmentAnswers, [q.id]: {...currentAns, [optIndex]: e.target.value}});
                                      }} style={{ width: '40px', padding: '5px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }} />
                                      <span>)</span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <button type="submit" className="btn-primary" style={{ padding: '15px', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer' }}>Enviar Respostas</button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-blue)' }}>Minhas Avaliações</h3>
                      {assessments.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center' }}>Você não tem nenhuma avaliação pendente.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {assessments.map(a => (
                            <div key={a.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h4 style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '1.2rem' }}>{a.title}</h4>
                                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px', display: 'flex', gap: '15px' }}>
                                    <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>{a.type}</span>
                                    <span>{a.isGraded ? '⭐ Vale Nota' : 'Sem Nota'}</span>
                                    {a.dueDate && <span>📅 Entrega: {moment(a.dueDate).format('DD/MM/YYYY')}</span>}
                                  </div>
                                </div>
                                <div>
                                  {a.status === 'Pendente' && (
                                    <button onClick={() => { setActiveAssessment(a); setAssessmentAnswers({}); }} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>Fazer Avaliação</button>
                                  )}
                                  {a.status === 'Entregue' && (
                                    <span style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>Aguardando Correção</span>
                                  )}
                                  {a.status === 'Corrigida' && (
                                    <span style={{ fontWeight: 'bold', color: 'green' }}>Corrigida ✅</span>
                                  )}
                                </div>
                              </div>
                              
                              {a.status === 'Corrigida' && (
                                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid green' }}>
                                  <h5 style={{ margin: '0 0 10px 0', color: 'green' }}>Resultado da Correção</h5>
                                  {a.isGraded && <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}><strong>Nota:</strong> {a.grade}</p>}
                                  <p style={{ margin: 0, color: '#4b5563' }}><strong>Feedback do Teacher:</strong><br/>{a.teacherFeedback || <em style={{color:'#999'}}>Sem comentários</em>}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "chat-private" && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                  <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                   <p style={{ color: '#666', margin: 0 }}>Fale diretamente com o Teacher Gus. Ninguém mais tem acesso a essas mensagens.</p>
                 </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px', marginBottom: '1rem', display:'flex', flexDirection:'column', gap:'15px' }}>
                    {privateMessages.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop:'auto', marginBottom:'auto'}}>Inicie a conversa com seu Teacher!</p>}
                    {privateMessages.map(msg => {
                      const isMe = msg.senderId === user.uid;
                      return (
                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                          <div style={{ background: isMe ? 'var(--primary-blue)' : 'white', color: isMe ? 'white' : 'var(--text-dark)', padding: '12px 18px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize:'1rem' }}>
                            {msg.text}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px', textAlign: isMe ? 'right' : 'left', padding:'0 5px' }}>
                            {moment(msg.createdAt).format('DD/MM HH:mm')}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendPrivateMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Mensagem..." value={newPrivateMessage} onChange={e => setNewPrivateMessage(e.target.value)} required style={{ flex: 1, padding: '15px 20px', borderRadius: '30px', border: '1px solid #ccc', fontSize:'1rem' }}/>
                    <motion.button whileTap={{scale:0.95}} type="submit" className="btn-primary" style={{ padding: '0 30px', borderRadius:'30px', cursor: 'pointer' }}>Enviar</motion.button>
                  </form>
                </div>
              )}

              {activeTab === "chat-global" && (
                 <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                 <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                   <p style={{ color: '#666', margin: 0 }}>Chat livre para interagir com toda a turma e compartilhar experiências.</p>
                 </div>
                 <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px', marginBottom: '1rem', display:'flex', flexDirection:'column', gap:'15px' }}>
                   {globalMessages.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop:'auto', marginBottom:'auto'}}>Inicie a conversa com a turma!</p>}
                   {globalMessages.map(msg => {
                     const isMe = msg.senderId === user.uid;
                     const senderProfile = allUsers.find(u => u.uid === msg.senderId);
                     const isTeacher = senderProfile?.role === 'teacher';
                     const photo = senderProfile?.photoURL;

                     return (
                       <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                         {photo ? (
                            <img src={photo} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', marginTop: '15px' }} />
                         ) : (
                            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: isTeacher ? 'var(--accent-gold)' : 'var(--secondary-blue)', color: isTeacher ? 'var(--primary-blue)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '15px' }}>
                               {msg.senderName.charAt(0)}
                            </div>
                         )}
                         <div>
                           <div style={{ fontSize: '0.8rem', color: isTeacher ? 'var(--primary-blue)' : '#666', fontWeight: isTeacher ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '2px' }}>
                              {isTeacher ? 'Teacher Gus' : msg.senderName}
                              {!isTeacher && senderProfile?.modality === 'Hotmart' && <span title="Aluno Hotmart">🔥</span>}
                              {!isTeacher && (senderProfile?.modality === 'Particular' || !senderProfile?.modality) && <span title="Aluno Particular">📖</span>}
                           </div>
                           <div style={{ background: isMe ? 'var(--primary-blue)' : (isTeacher ? 'var(--accent-gold)' : 'white'), color: isMe ? 'white' : 'var(--text-dark)', padding: '12px 18px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize:'1rem' }}>
                             {msg.text}
                           </div>
                           <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px', textAlign: isMe ? 'right' : 'left', padding:'0 5px' }}>
                             {moment(msg.createdAt).format('DD/MM HH:mm')}
                           </div>
                         </div>
                       </div>
                     )
                   })}
                   <div ref={messagesEndRef} />
                 </div>
                 {canChatGlobal ? (
                   <form onSubmit={handleSendGlobalMessage} style={{ display: 'flex', gap: '10px' }}>
                     <input type="text" placeholder="Mandar mensagem para a turma..." value={newGlobalMessage} onChange={e => setNewGlobalMessage(e.target.value)} required style={{ flex: 1, padding: '15px 20px', borderRadius: '30px', border: '1px solid #ccc', fontSize:'1rem' }}/>
                     <motion.button whileTap={{scale:0.95}} type="submit" className="btn-primary" style={{ padding: '0 30px', borderRadius:'30px', cursor: 'pointer' }}>Enviar</motion.button>
                   </form>
                 ) : (
                   <div style={{ padding: '15px', textAlign: 'center', color: '#666', background: '#f5f5f5', borderRadius: '30px', border: '1px solid #ccc' }}>
                     O seu pacote permite apenas a visualização deste chat.
                   </div>
                 )}
               </div>
              )}

              {activeTab === "aula-particular" && userProfile?.isPrivateRoomOpen && (
                <div className="card">
                  <h2 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>Aula Ao Vivo (Particular)</h2>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>O seu professor abriu a sala. Aproveite a aula!</p>
                  <VideoRoom 
                    roomName={`GusEnglish_Private_${user.uid}`} 
                    userName={userProfile?.name || "Aluno"} 
                    isModerator={false} 
                    onClose={() => setActiveTab("inicio")} 
                  />
                </div>
              )}

              {activeTab === "sala-global" && globalRoomOpen && (
                <div className="card">
                  <h2 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>Live da Turma</h2>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>Participe da aula ao vivo com a turma e o professor.</p>
                  <VideoRoom 
                    roomName={`GusEnglish_GlobalRoom`} 
                    userName={userProfile?.name || "Aluno"} 
                    isModerator={false} 
                    onClose={() => setActiveTab("inicio")} 
                  />
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
