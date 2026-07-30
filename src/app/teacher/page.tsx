"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, doc, where, updateDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth, auth } from "@/lib/firebase";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';
import VideoRoom from '@/components/VideoRoom';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: any) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary-blue)' }}>{title}</h3>
        <p style={{ color: '#666', marginBottom: '2rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--accent-gold)', color: 'var(--primary-blue)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Confirmar</button>
        </div>
      </motion.div>
    </div>
  );
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("alunos");
  
  const [students, setStudents] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");

  // LMS / Avaliações
  const [assessments, setAssessments] = useState<any[]>([]);
  const [showAssessmentBuilder, setShowAssessmentBuilder] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState<any>({
    title: '',
    type: 'Lição',
    isGraded: false,
    dueDate: '',
    questions: []
  });
  const [gradingAssessment, setGradingAssessment] = useState<any>(null);
  const [gradeDraft, setGradeDraft] = useState({ grade: '', feedback: '' });

  const [events, setEvents] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // For global chat avatars

  const [hasUnreadGlobal, setHasUnreadGlobal] = useState(false);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentProfileTab, setStudentProfileTab] = useState("tarefas");
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  const [confirmState, setConfirmState] = useState<{isOpen: boolean, title: string, message: string, action: () => void}>({ isOpen: false, title: "", message: "", action: () => {} });

  const [newStudent, setNewStudent] = useState({ name: "", email: "", password: "", modality: "Particular", package: "Start your English" });
  const [newMaterial, setNewMaterial] = useState({ title: "", url: "", studentId: "" });
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "", link: "", studentId: "" });
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [newGlobalMessage, setNewGlobalMessage] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push("/login");
      else {
        setCurrentUserUid(user.uid);
        setDoc(doc(db, "settings", "active_teacher"), { uid: user.uid }).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const qStudents = query(collection(db, "users"));
    let initialLoad = true;
    
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      const data: any[] = [];
      const usersMap: any[] = [];
      let playSound = false;

      snap.forEach(d => { 
        usersMap.push(d.data());
        if(d.data().role !== 'teacher') {
           data.push({ id: d.id, ...d.data() });
        } else if (d.data().uid === currentUserUid) {
           setTeacherProfile({ id: d.id, ...d.data() });
        }
      });
      
      snap.docChanges().forEach(change => {
         if (!initialLoad && (change.type === "added" || change.type === "modified")) {
             const studentData = change.doc.data();
             if (studentData.role !== 'teacher' && studentData.hasUnreadForTeacher) {
                 playSound = true;
             }
         }
      });
      
      setStudents(data);
      setAllUsers(usersMap);
      if (playSound) {
        audioRef.current?.play().catch(() => {});
        toast('Nova mensagem de um aluno!', { icon: '💬' });
      }
      initialLoad = false;
    });

    const qEvents = query(collection(db, "calendar"));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const data: any[] = [];
      snap.forEach(d => {
        const ev = d.data();
        data.push({ id: d.id, title: ev.title + (ev.studentName ? ` (${ev.studentName})` : ''), start: new Date(ev.start), end: new Date(ev.end), link: ev.link, studentId: ev.studentId });
      });
      setEvents(data);
    });

    const qGlobalChat = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    let initialLoadGlobal = true;
    const unsubGlobalChat = onSnapshot(qGlobalChat, (snap) => {
      const data: any[] = [];
      let hasNew = false;
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      snap.docChanges().forEach(change => {
        if (!initialLoadGlobal && change.type === "added") {
           if (change.doc.data().senderId !== currentUserUid) hasNew = true;
        }
      });
      setGlobalMessages(data);
      if (hasNew) setHasUnreadGlobal(true);
      setTimeout(scrollToBottom, 100);
      initialLoadGlobal = false;
    });

    return () => { unsubStudents(); unsubEvents(); unsubGlobalChat(); };
  }, [currentUserUid]);

  // Private Listeners (Active Student Profile)
  useEffect(() => {
    if(!selectedStudent || !currentUserUid) return;

    const qTasks = query(collection(db, "tasks"), where("studentId", "==", selectedStudent.uid));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setTasks(data);
    });

    const qMaterials = query(collection(db, "materials"), where("studentId", "==", selectedStudent.uid));
    const unsubMaterials = onSnapshot(qMaterials, (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setMaterials(data);
    });

    const qMessages = query(collection(db, "messages"), where("participants", "array-contains", currentUserUid));
    const unsubMessages = onSnapshot(qMessages, (snap) => {
      const data: any[] = [];
      snap.forEach(d => {
        const msg = d.data();
        if (msg.participants.includes(selectedStudent.uid) && msg.type !== "global") {
          data.push({ id: d.id, ...msg });
        }
      });
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setPrivateMessages(data);
      setTimeout(scrollToBottom, 100);
    });

    const qAssessments = query(collection(db, "assessments"), where("studentId", "==", selectedStudent.uid));
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
      toast.error("Erro ao carregar avaliações.");
    });

    if (selectedStudent.hasUnreadForTeacher && studentProfileTab === 'chat') {
       updateDoc(doc(db, "users", selectedStudent.id), { hasUnreadForTeacher: false });
    }

    return () => { unsubTasks(); unsubMaterials(); unsubMessages(); unsubAssessments(); };
  }, [selectedStudent, studentProfileTab, currentUserUid]);

  useEffect(() => {
    if (activeTab === "chat-global") setHasUnreadGlobal(false);
  }, [activeTab]);

  const requestConfirm = (title: string, message: string, action: () => void) => {
    setConfirmState({ isOpen: true, title, message, action });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const promise = async () => {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newStudent.email, newStudent.password);
      await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        name: newStudent.name,
        email: newStudent.email,
        role: "student",
        modality: newStudent.modality,
        package: newStudent.modality === "Hotmart" ? newStudent.package : null,
        createdAt: new Date().toISOString()
      });
      await signOut(secondaryAuth);
      setShowAddStudent(false);
      setNewStudent({ name: "", email: "", password: "", modality: "Particular", package: "Start your English" });
    };

    toast.promise(promise(), { loading: 'Criando aluno...', success: 'Aluno criado com sucesso!', error: (err) => `Erro: ${err.message}` });
    setLoading(false);
  };

  const handleDeleteStudent = (studentId: string, docId: string) => {
    requestConfirm("Remover Aluno", "Tem certeza que deseja remover este aluno? Ele perderá acesso.", async () => {
      await deleteDoc(doc(db, "users", docId));
      setSelectedStudent(null);
      setConfirmState({ ...confirmState, isOpen: false });
      toast.success("Aluno removido.");
    });
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newEvent.studentId) { toast.error("Selecione um aluno"); return; }
    const student = students.find(s => s.uid === newEvent.studentId);
    
    await addDoc(collection(db, "calendar"), {
      title: newEvent.title,
      start: new Date(newEvent.start).toISOString(),
      end: new Date(newEvent.end).toISOString(),
      link: newEvent.link,
      studentId: newEvent.studentId,
      studentName: student?.name || "Aluno"
    });
    setNewEvent({ title: "", start: "", end: "", link: "", studentId: "" });
    toast.success("Aula agendada!");
  };

  const handleSendPrivateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrivateMessage.trim() || !selectedStudent || !currentUserUid) return;
    await addDoc(collection(db, "messages"), {
      text: newPrivateMessage,
      senderName: "Teacher Gus",
      senderId: currentUserUid,
      participants: [currentUserUid, selectedStudent.uid].sort(),
      type: "private",
      createdAt: new Date().toISOString()
    });
    
    await updateDoc(doc(db, "users", selectedStudent.id), { hasUnreadForStudent: true });
    setNewPrivateMessage("");
  };

  const handleSendGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlobalMessage.trim() || !currentUserUid) return;
    await addDoc(collection(db, "messages"), {
      text: newGlobalMessage,
      senderName: "Teacher Gus",
      senderId: currentUserUid,
      type: "global",
      createdAt: new Date().toISOString()
    });
    setNewGlobalMessage("");
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newTask.trim()) return;
    await addDoc(collection(db, "tasks"), {
      studentId: selectedStudent.uid,
      description: newTask,
      completed: false,
      createdAt: new Date().toISOString()
    });
    setNewTask("");
    toast.success("Tarefa atribuída!");
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await addDoc(collection(db, "materials"), {
        ...newMaterial,
        studentId: selectedStudent.uid,
        createdAt: new Date().toISOString()
      });
      setNewMaterial({ title: "", url: "" });
      toast.success("Material adicionado!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (assessmentDraft.questions.length === 0) {
      toast.error("Adicione pelo menos uma questão.");
      return;
    }
    
    for (const q of assessmentDraft.questions) {
      if (!q.prompt.trim()) return toast.error("Preencha todas as perguntas.");
      if ((q.type === 'multiple_choice' || q.type === 'checkboxes') && (!q.options || q.options.length < 2)) {
        return toast.error("Questões de múltipla escolha/caixas precisam de pelo menos 2 opções.");
      }
      if (q.type === 'match_columns' && (!q.leftOptions || !q.rightOptions || q.leftOptions.length < 2 || q.rightOptions.length < 2)) {
        return toast.error("A questão de ligar colunas precisa ter pelo menos 2 itens em cada coluna.");
      }
    }

    try {
      await addDoc(collection(db, "assessments"), {
        ...assessmentDraft,
        studentId: selectedStudent.uid,
        status: 'Pendente',
        createdAt: new Date().toISOString()
      });
      toast.success("Avaliação enviada para o aluno!");
      setShowAssessmentBuilder(false);
      setAssessmentDraft({ title: '', type: 'Lição', isGraded: false, dueDate: '', questions: [] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleGradeAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingAssessment) return;
    try {
      await updateDoc(doc(db, "assessments", gradingAssessment.id), {
        status: 'Corrigida',
        grade: gradeDraft.grade,
        teacherFeedback: gradeDraft.feedback
      });
      toast.success("Avaliação corrigida com sucesso!");
      setGradingAssessment(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = (col: string, id: string, name: string = "este item") => {
    requestConfirm("Excluir", `Tem certeza que deseja excluir ${name}?`, async () => {
      await deleteDoc(doc(db, col, id));
      setConfirmState({ ...confirmState, isOpen: false });
      toast.success("Excluído com sucesso.");
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacherProfile?.id) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        updateDoc(doc(db, "users", teacherProfile.id), { photoURL: dataUrl });
        toast.success("Foto do Teacher atualizada!");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="dashboard-layout">
      <ConfirmModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.action} onCancel={() => setConfirmState({...confirmState, isOpen: false})} />
      <aside className="sidebar">
        <div className="sidebar-header">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <h2>Teacher Gus</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "alunos" ? "active" : ""}`} onClick={() => {setActiveTab("alunos"); setSelectedStudent(null);}}>Meus Alunos</button>
          <button className={`nav-item ${activeTab === "calendario" ? "active" : ""}`} onClick={() => setActiveTab("calendario")}>Calendário</button>
          <button className={`nav-item ${activeTab === "sala-global" ? "active" : ""}`} onClick={async () => {
            setActiveTab("sala-global");
            await setDoc(doc(db, "settings", "global_room"), { isOpen: true }, { merge: true });
          }} style={{ color: 'var(--accent-gold)' }}>
            🎥 Sala Global (Live)
          </button>
          <button className={`nav-item ${activeTab === "chat-global" ? "active" : ""}`} onClick={() => setActiveTab("chat-global")} style={{position: 'relative'}}>
            Chat da Turma
            {hasUnreadGlobal && activeTab !== "chat-global" && <span style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', width:'10px', height:'10px', borderRadius:'50%', background:'red'}}></span>}
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => signOut(auth)} className="btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>Sair</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="content-header">
          <h1>{activeTab === "alunos" ? "Painel de Alunos" : activeTab === "calendario" ? "Calendário Geral" : activeTab === "sala-global" ? "Sala de Aula Global" : "Chat de Interação da Turma"}</h1>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{fontWeight: 'bold', color: 'var(--primary-blue)'}}>Teacher Gustavo</span>
            <label style={{ cursor: 'pointer', position: 'relative' }} title="Clique para alterar a foto">
              {teacherProfile?.photoURL ? (
                <img src={teacherProfile.photoURL} alt="Avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }} />
              ) : (
                <div className="avatar" style={{ width: '45px', height: '45px', background: 'var(--accent-gold)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
                  TG
                </div>
              )}
              <div style={{position: 'absolute', bottom: '-5px', right: '-5px', background: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', fontSize: '10px'}}>📷</div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
          </div>
        </header>

        <div className="content-body">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab + (selectedStudent ? "-profile" : "")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              
              {activeTab === "alunos" && !selectedStudent && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{fontSize:'1.5rem'}}>Alunos Cadastrados</h3>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddStudent(!showAddStudent)} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px' }}>
                      {showAddStudent ? "Cancelar" : "+ Novo Aluno"}
                    </motion.button>
                  </div>
                  
                  {showAddStudent && (
                    <motion.form initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} onSubmit={handleCreateStudent} style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <input type="text" placeholder="Nome" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required className="form-group input" style={{flex: '1 1 30%', padding: '12px', borderRadius: '8px', border:'1px solid #ccc'}}/>
                      <input type="email" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} required className="form-group input" style={{flex: '1 1 30%', padding: '12px', borderRadius: '8px', border:'1px solid #ccc'}}/>
                      <input type="password" placeholder="Senha" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} required minLength={6} className="form-group input" style={{flex: '1 1 30%', padding: '12px', borderRadius: '8px', border:'1px solid #ccc'}}/>
                      
                      <select value={newStudent.modality} onChange={e => setNewStudent({...newStudent, modality: e.target.value})} className="form-group input" style={{flex: '1 1 45%', padding: '12px', borderRadius: '8px', border:'1px solid #ccc'}}>
                        <option value="Particular">Particular</option>
                        <option value="Hotmart">Hotmart</option>
                      </select>

                      {newStudent.modality === "Hotmart" && (
                        <select value={newStudent.package} onChange={e => setNewStudent({...newStudent, package: e.target.value})} className="form-group input" style={{flex: '1 1 45%', padding: '12px', borderRadius: '8px', border:'1px solid #ccc'}}>
                          <option value="Start your English">Start your English</option>
                          <option value="English Evolution">English Evolution</option>
                          <option value="Becoming Fluent">Becoming Fluent</option>
                        </select>
                      )}

                      <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-secondary" disabled={loading} style={{borderRadius:'8px', padding:'12px 30px'}}>{loading ? "..." : "Salvar"}</button>
                      </div>
                    </motion.form>
                  )}

                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.5rem'}}>
                    {students.map(s => (
                      <motion.div whileHover={{ y: -5 }} key={s.id} onClick={() => setSelectedStudent(s)} style={{ background: '#f8fafc', border:'1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative'}}>
                        {s.hasUnreadForTeacher && (
                          <div style={{position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: 'red', borderRadius: '50%', border: '2px solid white'}}></div>
                        )}
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                          {s.photoURL ? (
                            <img src={s.photoURL} alt="Foto" style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover'}} />
                          ) : (
                            <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'var(--primary-blue)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:'bold'}}>{s.name.charAt(0)}</div>
                          )}
                          <div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                               <h4 style={{margin:0, color:'var(--primary-blue)', fontSize:'1.1rem'}}>{s.name}</h4>
                               {s.modality === 'Hotmart' && s.package === 'Start your English' && <span title="Start your English" style={{ fontSize: '1.2rem' }}>🥉</span>}
                               {s.modality === 'Hotmart' && s.package === 'English Evolution' && <span title="English Evolution" style={{ fontSize: '1.2rem' }}>🥈</span>}
                               {s.modality === 'Hotmart' && s.package === 'Becoming Fluent' && <span title="Becoming Fluent" style={{ fontSize: '1.2rem' }}>🥇</span>}
                            </div>
                            <p style={{margin:0, color:'#64748b', fontSize:'0.9rem'}}>{s.email}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "alunos" && selectedStudent && (
                <div>
                  <button onClick={() => setSelectedStudent(null)} style={{color:'var(--secondary-blue)', fontWeight:'bold', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'5px', cursor: 'pointer', border: 'none', background: 'transparent'}}>← Voltar para lista</button>
                  <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                      {selectedStudent.photoURL ? (
                         <img src={selectedStudent.photoURL} alt="Foto" style={{width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover'}} />
                      ) : (
                         <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'var(--primary-blue)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:'bold'}}>{selectedStudent.name.charAt(0)}</div>
                      )}
                      <div>
                        <h2 style={{margin:0, color:'var(--primary-blue)'}}>{selectedStudent.name}</h2>
                        <p style={{margin:0, color:'#64748b'}}>{selectedStudent.email}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteStudent(selectedStudent.uid, selectedStudent.id)} style={{color:'red', border:'1px solid red', padding:'8px 16px', borderRadius:'8px', cursor: 'pointer', background: 'transparent'}}>Remover Aluno</button>
                  </div>

                  <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap: 'wrap'}}>
                    {['tarefas', 'materiais', 'chat', 'avaliacoes', 'video'].map(t => {
                      if ((t === 'materiais' || t === 'avaliacoes') && selectedStudent.modality === 'Hotmart') return null;

                      return (
                      <button key={t} onClick={async () => {
                        setStudentProfileTab(t);
                        if (t === 'video') {
                          await updateDoc(doc(db, "users", selectedStudent.id), { isPrivateRoomOpen: true });
                        }
                      }} style={{cursor: 'pointer', padding:'10px 20px', borderRadius:'30px', background: studentProfileTab === t ? 'var(--primary-blue)' : 'white', color: studentProfileTab === t ? 'white' : 'var(--primary-blue)', fontWeight:'bold', border: studentProfileTab === t ? 'none' : '1px solid var(--primary-blue)'}}>
                        {t === 'tarefas' && "Tarefas"}
                        {t === 'materiais' && "Materiais"}
                        {t === 'avaliacoes' && "Avaliações (LMS)"}
                        {t === 'video' && "🎥 Aula Ao Vivo"}
                        {t === 'chat' && "Chat Privado" + (selectedStudent.hasUnreadForTeacher ? " 🔴" : "")}
                      </button>
                      );
                    })}
                  </div>

                  <div className="card">
                    {studentProfileTab === 'tarefas' && (
                      <div>
                        <form onSubmit={handleAssignTask} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                          <input type="text" placeholder="Descreva a nova tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} required style={{flex:1, padding: '12px', borderRadius: '8px', border:'1px solid #ccc'}}/>
                          <button type="submit" className="btn-primary" style={{borderRadius:'8px', cursor: 'pointer'}}>Atribuir Tarefa</button>
                        </form>
                        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                          {tasks.map(t => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: t.completed ? '#e8f5e9' : 'var(--bg-color)', borderRadius: '8px' }}>
                              <div>
                                <span style={{ textDecoration: t.completed ? 'line-through' : 'none', fontWeight:'500' }}>{t.description}</span>
                                <div style={{fontSize:'0.8rem', color:'#666', marginTop:'5px'}}>Criada em {moment(t.createdAt).format('DD/MM/YYYY')} • Status: <strong style={{color: t.completed ? 'green' : 'orange'}}>{t.completed ? 'Concluída' : 'Pendente'}</strong></div>
                              </div>
                              <button onClick={() => handleDelete('tasks', t.id, 'esta tarefa')} style={{color:'red', background: 'transparent', border: 'none', cursor: 'pointer'}}>Excluir</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {studentProfileTab === 'materiais' && (
                      <div>
                        <form onSubmit={handleAddMaterial} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                          <input type="text" placeholder="Nome do Arquivo (Ex: Unit 1 PDF)" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} required style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}}/>
                          <input type="url" placeholder="Link do Google Drive" value={newMaterial.url} onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} required style={{flex:2, padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}}/>
                          <button type="submit" className="btn-primary" style={{borderRadius:'8px', cursor: 'pointer'}}>Adicionar</button>
                        </form>
                        <ul style={{listStyle:'none', padding:0}}>
                          {materials.map(m => (
                            <li key={m.id} style={{ marginBottom: '1rem', padding: '1rem', background:'var(--bg-color)', borderRadius:'8px', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
                              <div>
                                <a href={m.url} target="_blank" style={{ color: 'var(--primary-blue)', fontWeight: 'bold', fontSize:'1.1rem' }}>📄 {m.title}</a>
                                <div style={{fontSize:'0.8rem', color:'#666', marginTop:'5px'}}>Enviado em {moment(m.createdAt).format('DD/MM/YYYY')}</div>
                              </div>
                              <button onClick={() => handleDelete('materials', m.id, 'este material')} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>Excluir</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {studentProfileTab === 'avaliacoes' && (
                      <div>
                        {showAssessmentBuilder ? (
                          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                              <h3 style={{ margin: 0, color: 'var(--primary-blue)' }}>Criar Nova Avaliação</h3>
                              <button onClick={() => setShowAssessmentBuilder(false)} style={{ color: '#666', border: 'none', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                            </div>

                            <form onSubmit={handleSaveAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                              <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 2 }}>
                                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Título</label>
                                  <input type="text" required value={assessmentDraft.title} onChange={e => setAssessmentDraft({...assessmentDraft, title: e.target.value})} placeholder="Ex: Quiz Unit 1" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Tipo</label>
                                  <select value={assessmentDraft.type} onChange={e => setAssessmentDraft({...assessmentDraft, type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                    <option value="Lição">Lição</option>
                                    <option value="Prova">Prova</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <input type="checkbox" id="isGraded" checked={assessmentDraft.isGraded} onChange={e => setAssessmentDraft({...assessmentDraft, isGraded: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                                  <label htmlFor="isGraded" style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>Vale Nota?</label>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Data de Entrega (Opcional)</label>
                                  <input type="date" value={assessmentDraft.dueDate} onChange={e => setAssessmentDraft({...assessmentDraft, dueDate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                </div>
                              </div>

                              <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '1rem 0' }} />
                              
                              <h4 style={{ color: 'var(--primary-blue)' }}>Questões</h4>
                              
                              {assessmentDraft.questions.map((q: any, qIndex: number) => (
                                <div key={q.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ccc', position: 'relative' }}>
                                  <button type="button" onClick={() => {
                                    const newQs = [...assessmentDraft.questions];
                                    newQs.splice(qIndex, 1);
                                    setAssessmentDraft({...assessmentDraft, questions: newQs});
                                  }} style={{ position: 'absolute', top: '10px', right: '10px', color: 'red', border: 'none', background: 'transparent', cursor: 'pointer' }}>Remover Questão</button>
                                  
                                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '10px' }}>
                                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      <div style={{ display: 'flex', gap: '10px' }}>
                                        <input type="text" placeholder="Nº (Ex: 1, 2a)" value={q.number || ''} onChange={e => {
                                          const newQs = [...assessmentDraft.questions];
                                          newQs[qIndex].number = e.target.value;
                                          setAssessmentDraft({...assessmentDraft, questions: newQs});
                                        }} style={{ width: '130px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 'bold' }} />
                                        <input type="text" placeholder="Título / Instrução (Opcional). Ex: Complete with am, is, are" value={q.instruction || ''} onChange={e => {
                                          const newQs = [...assessmentDraft.questions];
                                          newQs[qIndex].instruction = e.target.value;
                                          setAssessmentDraft({...assessmentDraft, questions: newQs});
                                        }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 'bold' }} />
                                      </div>
                                      
                                      {!['multiple_choice', 'checkboxes', 'match_columns'].includes(q.type) && (
                                        <textarea required rows={4} placeholder={
                                          q.type === 'fill_in_the_blanks' ? "Ex:\na. I ___ a student.\nb. She ___ happy." :
                                          q.type === 'inline_dropdown' ? "Ex:\na. I [am/is/are] happy." :
                                          "Pergunta / Texto Principal..."
                                        } value={q.prompt} onChange={e => {
                                          const newQs = [...assessmentDraft.questions];
                                          newQs[qIndex].prompt = e.target.value;
                                          setAssessmentDraft({...assessmentDraft, questions: newQs});
                                        }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', fontFamily: 'inherit' }} />
                                      )}
                                      
                                      {q.type === 'fill_in_the_blanks' && <small style={{ color: '#666', marginTop: '-5px', display: 'block' }}>Dica: digite 3 underlines (___) onde quiser que a lacuna apareça. Aceita quebras de linha!</small>}
                                      {q.type === 'inline_dropdown' && <small style={{ color: '#666', marginTop: '-5px', display: 'block' }}>Dica: coloque as opções entre colchetes separadas por barra. Ex: [am/is/are]</small>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <select value={q.type} onChange={e => {
                                        const newQs = [...assessmentDraft.questions];
                                        newQs[qIndex].type = e.target.value;
                                        if (e.target.value === 'multiple_choice' || e.target.value === 'checkboxes') {
                                          newQs[qIndex].options = ['Opção 1'];
                                        } else if (e.target.value === 'match_columns') {
                                          newQs[qIndex].leftOptions = ['Item 1', 'Item 2'];
                                          newQs[qIndex].rightOptions = ['Opção A', 'Opção B'];
                                        } else {
                                          newQs[qIndex].options = [];
                                        }
                                        setAssessmentDraft({...assessmentDraft, questions: newQs});
                                      }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                        <option value="short_answer">Resposta Curta</option>
                                        <option value="paragraph">Parágrafo</option>
                                        <option value="multiple_choice">Múltipla Escolha</option>
                                        <option value="checkboxes">Caixas de Seleção</option>
                                        <option value="fill_in_the_blanks">Completar Lacunas ( ___ )</option>
                                        <option value="inline_dropdown">Escolha na Linha ( [a/b] )</option>
                                        <option value="match_columns">Ligar Colunas</option>
                                      </select>
                                    </div>
                                  </div>

                                  {(q.type === 'multiple_choice' || q.type === 'checkboxes') && (
                                    <div style={{ paddingLeft: '1rem' }}>
                                      {q.options.map((opt: string, optIndex: number) => (
                                        <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                          {q.type === 'multiple_choice' ? <div style={{width:'15px',height:'15px',borderRadius:'50%',border:'2px solid #ccc'}}></div> : <div style={{width:'15px',height:'15px',border:'2px solid #ccc'}}></div>}
                                          <input type="text" required value={opt} onChange={e => {
                                            const newQs = [...assessmentDraft.questions];
                                            newQs[qIndex].options[optIndex] = e.target.value;
                                            setAssessmentDraft({...assessmentDraft, questions: newQs});
                                          }} style={{ flex: 1, padding: '8px', border: 'none', borderBottom: '1px solid #ccc', outline: 'none' }} />
                                          <button type="button" onClick={() => {
                                            const newQs = [...assessmentDraft.questions];
                                            newQs[qIndex].options.splice(optIndex, 1);
                                            setAssessmentDraft({...assessmentDraft, questions: newQs});
                                          }} style={{ color: '#999', cursor: 'pointer', border: 'none', background: 'transparent' }}>X</button>
                                        </div>
                                      ))}
                                      <button type="button" onClick={() => {
                                        const newQs = [...assessmentDraft.questions];
                                        newQs[qIndex].options.push(`Opção ${newQs[qIndex].options.length + 1}`);
                                        setAssessmentDraft({...assessmentDraft, questions: newQs});
                                      }} style={{ color: 'var(--secondary-blue)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>+ Adicionar opção</button>
                                    </div>
                                  )}

                                  {(q.type === 'match_columns') && (
                                    <div style={{ display: 'flex', gap: '2rem', paddingLeft: '1rem', marginTop: '1rem' }}>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Coluna da Esquerda (Números)</p>
                                        {q.leftOptions?.map((opt: string, optIndex: number) => (
                                          <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 'bold' }}>{optIndex + 1}.</span>
                                            <input type="text" required value={opt} onChange={e => {
                                              const newQs = [...assessmentDraft.questions];
                                              newQs[qIndex].leftOptions[optIndex] = e.target.value;
                                              setAssessmentDraft({...assessmentDraft, questions: newQs});
                                            }} style={{ flex: 1, padding: '8px', border: 'none', borderBottom: '1px solid #ccc', outline: 'none' }} />
                                            <button type="button" onClick={() => {
                                              const newQs = [...assessmentDraft.questions];
                                              newQs[qIndex].leftOptions.splice(optIndex, 1);
                                              setAssessmentDraft({...assessmentDraft, questions: newQs});
                                            }} style={{ color: '#999', cursor: 'pointer', border: 'none', background: 'transparent' }}>X</button>
                                          </div>
                                        ))}
                                        <button type="button" onClick={() => {
                                          const newQs = [...assessmentDraft.questions];
                                          newQs[qIndex].leftOptions.push(`Item ${newQs[qIndex].leftOptions.length + 1}`);
                                          setAssessmentDraft({...assessmentDraft, questions: newQs});
                                        }} style={{ color: 'var(--secondary-blue)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>+ Adicionar Item Esquerda</button>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Coluna da Direita (Respostas)</p>
                                        {q.rightOptions?.map((opt: string, optIndex: number) => (
                                          <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 'bold' }}>( )</span>
                                            <input type="text" required value={opt} onChange={e => {
                                              const newQs = [...assessmentDraft.questions];
                                              newQs[qIndex].rightOptions[optIndex] = e.target.value;
                                              setAssessmentDraft({...assessmentDraft, questions: newQs});
                                            }} style={{ flex: 1, padding: '8px', border: 'none', borderBottom: '1px solid #ccc', outline: 'none' }} />
                                            <button type="button" onClick={() => {
                                              const newQs = [...assessmentDraft.questions];
                                              newQs[qIndex].rightOptions.splice(optIndex, 1);
                                              setAssessmentDraft({...assessmentDraft, questions: newQs});
                                            }} style={{ color: '#999', cursor: 'pointer', border: 'none', background: 'transparent' }}>X</button>
                                          </div>
                                        ))}
                                        <button type="button" onClick={() => {
                                          const newQs = [...assessmentDraft.questions];
                                          newQs[qIndex].rightOptions.push(`Opção ${newQs[qIndex].rightOptions.length + 1}`);
                                          setAssessmentDraft({...assessmentDraft, questions: newQs});
                                        }} style={{ color: 'var(--secondary-blue)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>+ Adicionar Opção Direita</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}

                              <button type="button" onClick={() => setAssessmentDraft({...assessmentDraft, questions: [...assessmentDraft.questions, { id: Date.now().toString(), type: 'short_answer', prompt: '', options: [] }]})} style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px', border: '2px dashed var(--primary-blue)', color: 'var(--primary-blue)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar Nova Questão</button>

                              <button type="submit" className="btn-primary" style={{ marginTop: '1rem', borderRadius: '8px', padding: '15px', cursor: 'pointer' }}>Atribuir ao Aluno</button>
                            </form>
                          </div>
                        ) : gradingAssessment ? (
                          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                              <h3 style={{ margin: 0, color: 'var(--primary-blue)' }}>Corrigir: {gradingAssessment.title}</h3>
                              <button onClick={() => setGradingAssessment(null)} style={{ color: '#666', border: 'none', background: 'transparent', cursor: 'pointer' }}>Voltar</button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                              {gradingAssessment.questions.map((q: any, i: number) => {
                                const answer = gradingAssessment.studentResponses?.[q.id];
                                return (
                                  <div key={q.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>{i + 1}. {q.prompt}</p>
                                    <div style={{ color: '#4b5563', padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
                                      {Array.isArray(answer) ? answer.join(', ') : 
                                       (typeof answer === 'object' && answer !== null) ? 
                                          q.type === 'match_columns' ? 
                                            Object.keys(answer).map(k => {
                                              const rightIndex = parseInt(k);
                                              const leftItemIndex = parseInt(answer[k]) - 1;
                                              const rightText = q.rightOptions?.[rightIndex] || `Opção ${rightIndex + 1}`;
                                              const leftText = q.leftOptions?.[leftItemIndex] || `Item ${answer[k]}`;
                                              return <div key={k}><strong>{leftText} <span style={{color: '#999', fontWeight: 'normal', fontSize: '0.9em'}}>(Nº {answer[k]})</span>:</strong> {rightText}</div>
                                            })
                                          : Object.keys(answer).map(k => <div key={k}><strong>Lacuna {parseInt(k) + 1}:</strong> {answer[k]}</div>) 
                                       : (answer || <em style={{color: '#999'}}>Não respondida</em>)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <form onSubmit={handleGradeAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {gradingAssessment.isGraded && (
                                <div>
                                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Nota</label>
                                  <input type="text" required value={gradeDraft.grade} onChange={e => setGradeDraft({...gradeDraft, grade: e.target.value})} placeholder="Ex: 10/10, A+, 95..." style={{ width: '100%', maxWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                </div>
                              )}
                              <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Comentários / Feedback</label>
                                <textarea value={gradeDraft.feedback} onChange={e => setGradeDraft({...gradeDraft, feedback: e.target.value})} placeholder="Escreva um feedback para o aluno..." rows={4} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                              </div>
                              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer' }}>Finalizar Correção</button>
                            </form>
                          </div>
                        ) : (
                          <div>
                            <button onClick={() => setShowAssessmentBuilder(true)} className="btn-primary" style={{ marginBottom: '2rem', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>+ Criar Nova Avaliação</button>
                            
                            {assessments.length === 0 ? (
                              <p style={{ color: '#666', textAlign: 'center' }}>Nenhuma avaliação atribuída para este aluno.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {assessments.map(a => (
                                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div>
                                      <h4 style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>{a.title} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', marginLeft: '10px' }}>{a.type}</span></h4>
                                      <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px', display: 'flex', gap: '15px' }}>
                                        <span>{a.isGraded ? '⭐ Vale Nota' : 'Sem Nota'}</span>
                                        {a.dueDate && <span>📅 Entrega: {moment(a.dueDate).format('DD/MM/YYYY')}</span>}
                                        <span style={{ fontWeight: 'bold', color: a.status === 'Entregue' ? 'var(--accent-gold)' : a.status === 'Corrigida' ? 'green' : 'orange' }}>{a.status}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                      {a.status === 'Entregue' && (
                                        <button onClick={() => { setGradingAssessment(a); setGradeDraft({ grade: '', feedback: '' }); }} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Corrigir</button>
                                      )}
                                      {a.status === 'Corrigida' && (
                                        <button onClick={() => { setGradingAssessment(a); setGradeDraft({ grade: a.grade || '', feedback: a.teacherFeedback || '' }); }} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: '#ccc', color: '#333' }}>Ver Correção</button>
                                      )}
                                      <button onClick={() => handleDelete('assessments', a.id, 'esta avaliação')} style={{ color: 'red', border: '1px solid red', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}>Excluir</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {studentProfileTab === 'chat' && (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px', marginBottom: '1rem', display:'flex', flexDirection:'column', gap:'15px' }}>
                          {privateMessages.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop:'auto', marginBottom:'auto'}}>Nenhuma mensagem ainda.</p>}
                          {privateMessages.map(msg => {
                            const isMe = msg.senderId === currentUserUid;
                            const photo = isMe ? teacherProfile?.photoURL : selectedStudent.photoURL;

                            return (
                              <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                 {photo ? (
                                    <img src={photo} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', marginTop: '15px' }} />
                                 ) : (
                                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: isMe ? 'var(--accent-gold)' : 'var(--primary-blue)', color: isMe ? 'var(--primary-blue)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '15px' }}>
                                       {msg.senderName.charAt(0)}
                                    </div>
                                 )}
                                 <div>
                                  <div style={{ background: isMe ? 'var(--primary-blue)' : 'white', color: isMe ? 'white' : 'var(--text-dark)', padding: '12px 18px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize:'1rem' }}>
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
                        <form onSubmit={handleSendPrivateMessage} style={{ display: 'flex', gap: '10px' }}>
                          <input type="text" placeholder={`Enviar mensagem para ${selectedStudent.name}...`} value={newPrivateMessage} onChange={e => setNewPrivateMessage(e.target.value)} required style={{ flex: 1, padding: '15px 20px', borderRadius: '30px', border: '1px solid #ccc', fontSize:'1rem' }}/>
                          <motion.button whileTap={{scale:0.95}} type="submit" className="btn-primary" style={{ padding: '0 30px', borderRadius:'30px', cursor: 'pointer' }}>Enviar</motion.button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "calendario" && (
                <div className="card">
                  <div style={{marginBottom:'2rem', padding:'1.5rem', background:'var(--bg-color)', borderRadius:'12px'}}>
                    <h3 style={{marginBottom:'1rem'}}>Agendar Nova Aula</h3>
                    <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <select required value={newEvent.studentId} onChange={e => setNewEvent({...newEvent, studentId: e.target.value})} style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc', width: '100%'}}>
                          <option value="">-- Selecione o Aluno --</option>
                          {students.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                         <input type="text" placeholder="Título (ex: Aula Conversação)" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc', width: '100%'}}/>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Início da Aula</label>
                        <input type="datetime-local" value={newEvent.start} onChange={e => setNewEvent({...newEvent, start: e.target.value})} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}}/>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Fim da Aula</label>
                        <input type="datetime-local" value={newEvent.end} onChange={e => setNewEvent({...newEvent, end: e.target.value})} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}}/>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <input type="url" placeholder="Link da Reunião (Meet/Zoom)" value={newEvent.link} onChange={e => setNewEvent({...newEvent, link: e.target.value})} style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc', width: '100%'}}/>
                      </div>
                      <button type="submit" className="btn-secondary" style={{gridColumn:'1 / -1', borderRadius:'8px', padding:'12px', cursor: 'pointer'}}>Adicionar ao Calendário</button>
                    </form>
                  </div>
                  <div style={{height: '600px'}}>
                    <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" messages={{ next: "Próx", previous: "Ant", today: "Hoje", month: "Mês", week: "Semana", day: "Dia" }} onSelectEvent={(event: any) => { requestConfirm("Excluir Aula", `Deseja desmarcar a aula: ${event.title}?`, () => { handleDelete('calendar', event.id, 'esta aula'); }); }} />
                  </div>
                </div>
              )}

              {activeTab === "chat-global" && (
                 <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '650px' }}>
                 <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                   <p style={{ color: '#666', margin: 0 }}>Este é o espaço de interação geral.</p>
                 </div>
                 <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px', marginBottom: '1rem', display:'flex', flexDirection:'column', gap:'15px' }}>
                   {globalMessages.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop:'auto', marginBottom:'auto'}}>Inicie a conversa!</p>}
                   {globalMessages.map(msg => {
                     const isMe = msg.senderId === currentUserUid;
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
                 <form onSubmit={handleSendGlobalMessage} style={{ display: 'flex', gap: '10px' }}>
                   <input type="text" placeholder="Mensagem..." value={newGlobalMessage} onChange={e => setNewGlobalMessage(e.target.value)} required style={{ flex: 1, padding: '15px 20px', borderRadius: '30px', border: '1px solid #ccc', fontSize:'1rem' }}/>
                   <motion.button whileTap={{scale:0.95}} type="submit" className="btn-primary" style={{ padding: '0 30px', borderRadius:'30px', cursor: 'pointer' }}>Enviar</motion.button>
                 </form>
               </div>
              )}

              {activeTab === "alunos" && selectedStudent && studentProfileTab === "video" && (
                <div className="card">
                  <h2 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>Aula Ao Vivo: {selectedStudent.name}</h2>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>Esta sala é privada apenas para você e o aluno.</p>
                  <VideoRoom 
                    roomName={`GusEnglish_Private_${selectedStudent.id}`} 
                    userName="Teacher Gus" 
                    isModerator={true} 
                    onClose={async () => {
                      await updateDoc(doc(db, "users", selectedStudent.id), { isPrivateRoomOpen: false });
                      setStudentProfileTab("chat");
                    }} 
                  />
                </div>
              )}

              {activeTab === "sala-global" && (
                <div className="card">
                  <h2 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>Sala de Aula Global</h2>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>Todos os alunos conectados podem entrar nesta sala.</p>
                  <VideoRoom 
                    roomName={`GusEnglish_GlobalRoom`} 
                    userName="Teacher Gus" 
                    isModerator={true} 
                    onClose={async () => {
                      await setDoc(doc(db, "settings", "global_room"), { isOpen: false }, { merge: true });
                      setActiveTab("alunos");
                    }} 
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
