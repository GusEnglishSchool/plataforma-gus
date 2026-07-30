"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import TestimonialVideo from '@/components/TestimonialVideo';

function FAQItem({ faq, index }: { faq: {q: string, a: string}, index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ delay: index * 0.1 }}
      style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ width: '100%', padding: '1.5rem', textAlign: 'left', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-blue)', cursor: 'pointer', border: 'none' }}
      >
        {faq.q}
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>▼</motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', color: '#4b5563', lineHeight: 1.6 }}>
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Home() {
  return (
    <>
      <header className="header" style={{ position: 'fixed', width: '100%', background: 'rgba(0, 34, 68, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="container header-content">
          <div className="logo">
            <Image src="/logo.png" alt="Gus English School Logo" width={40} height={40} />
            <span>Gus English School</span>
          </div>
          <nav className="nav-links">
            <a href="#sobre" className="nav-link">Sobre o Teacher</a>
            <a href="#plataforma" className="nav-link">A Plataforma</a>
            <Link href="/login" className="btn-primary" style={{ padding: '8px 24px', fontSize: '1rem' }}>
              Portal do Aluno
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="lp-hero">
          <div className="lp-hero-content">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
            >
              Chega de cursos genéricos. Alcance a fluência com um <span>acompanhamento de verdade.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Aprenda inglês com o Teacher Gus e tenha acesso exclusivo a uma plataforma 100% focada na sua evolução diária. Você não é só mais um número.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <a href="https://wa.me/5511913280746" target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.2rem', display: 'inline-block' }}>
                Aulas Particulares
              </a>
              <a href="#planos" className="btn-secondary" style={{ padding: '16px 40px', fontSize: '1.2rem', display: 'inline-block', background: 'transparent', border: '2px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>
                Pacotes Hotmart
              </a>
            </motion.div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="sobre" className="lp-about">
          <div className="lp-about-grid">
            <motion.div 
              className="lp-about-img-container"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* NOTE: User needs to put teacher-gus.jpg in public folder */}
              <Image src="/teacher-gus.jpeg" alt="Teacher Gus" fill style={{ objectFit: 'cover' }} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--primary-blue)' }}>Prazer, sou o Teacher Gus.</h2>
              <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.8 }}>
                O inglês é a minha paixão desde os 8 anos de idade. Comecei explorando o idioma de forma autodidata através de jogos e da internet, e aos 9 anos iniciei uma jornada formal de estudos que durou quase uma década. Essa vivência profunda me deu não apenas fluência, mas uma compreensão real de como absorver o idioma de forma natural.
              </p>
              <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '2rem', lineHeight: 1.8 }}>
                Nos últimos 5 anos, tenho me dedicado de corpo e alma ao ensino da língua inglesa. Após me especializar em escolas preparatórias, criei um método único que foca exatamente no que importa: <strong>a sua dificuldade atual e o seu objetivo final</strong>. Acredito que o aprendizado não deve ser engessado, é um processo incrível acompanhar a evolução de cada aluno e ver os resultados ganhando vida. Comigo, você terá todo o suporte necessário para alcançar a tão sonhada fluência.
              </p>
            </motion.div>
          </div>
        </section>

        {/* PLATFORM SECTION */}
        <section id="plataforma" className="lp-platform">
          <div className="lp-platform-header">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ fontSize: '2.5rem', color: 'var(--primary-blue)' }}
            >
              O Seu Maior Diferencial
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: '1.1rem', color: '#6b7280' }}
            >
              Ao estudar comigo, você não fica perdido em um grupo de WhatsApp. Você ganha acesso vitalício a um portal do aluno 100% próprio, criado para acelerar o seu aprendizado.
            </motion.p>
          </div>

          <div className="lp-cards-grid">
            <motion.div className="lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="lp-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
              </div>
              <h3>Acompanhamento Real</h3>
              <p style={{ color: '#4b5563' }}>Suas tarefas e evolução mapeadas em um dashboard intuitivo para você ver o seu progresso dia após dia.</p>
            </motion.div>
            
            <motion.div className="lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="lp-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              </div>
              <h3>Contato Direto</h3>
              <p style={{ color: '#4b5563' }}>Um chat privado exclusivo com o teacher para tirar dúvidas 24/7 e um chat global para interagir com a turma.</p>
            </motion.div>
            
            <motion.div className="lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="lp-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
              </div>
              <h3>Materiais sob Medida</h3>
              <p style={{ color: '#4b5563' }}>Biblioteca individual com PDFs, áudios e links selecionados a dedo exatamente para o seu nível atual.</p>
            </motion.div>

            <motion.div className="lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
              <div className="lp-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
              </div>
              <h3>Calendário Integrado</h3>
              <p style={{ color: '#4b5563' }}>Sua agenda de aulas sempre visível, com links do Google Meet/Zoom à um clique de distância.</p>
            </motion.div>
          </div>
        </section>

        {/* PLANOS SECTION */}
        <section id="planos" className="lp-about" style={{ background: 'var(--bg-color)', textAlign: 'center' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: '2.5rem', color: 'var(--primary-blue)', marginBottom: '1rem' }}
          >
            Escolha o Plano Ideal para Você
          </motion.h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem auto' }}>Estude no seu ritmo com nossos cursos na Hotmart, do zero à fluência.</p>

          <div className="lp-cards-grid" style={{ alignItems: 'stretch' }}>
            <motion.div className="lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🥉</div>
              <h3 style={{ color: 'var(--primary-blue)', fontSize: '1.5rem' }}>Start your English</h3>
              <ul style={{ color: '#4b5563', textAlign: 'left', marginTop: '1.5rem', paddingLeft: '1.5rem', marginBottom: '2rem', flex: 1 }}>
                <li style={{ marginBottom: '0.8rem' }}>Acesso ao curso gravado</li>
                <li style={{ marginBottom: '0.8rem' }}>Comunidade Hotmart</li>
                <li style={{ marginBottom: '0.8rem' }}>Apostilas em PDF</li>
                <li style={{ marginBottom: '0.8rem' }}>Acesso ao Chat Global da Turma na plataforma (somente visualização)</li>
              </ul>
              <a href="#" className="btn-primary" style={{ display: 'block', textAlign: 'center', background: '#ccc', color: '#666', boxShadow: 'none' }}>Em Breve</a>
            </motion.div>
            
            <motion.div className="lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} style={{ border: '2px solid var(--accent-gold)', transform: 'scale(1.05)', display: 'flex', flexDirection: 'column', background: 'white' }}>
              <div style={{ position: 'absolute', top: '-15px', background: 'var(--accent-gold)', color: 'var(--primary-blue)', padding: '5px 20px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', left: '50%', transform: 'translateX(-50%)' }}>MAIS POPULAR</div>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem', marginTop: '1rem' }}>🥈</div>
              <h3 style={{ color: 'var(--primary-blue)', fontSize: '1.5rem' }}>English Evolution</h3>
              <ul style={{ color: '#4b5563', textAlign: 'left', marginTop: '1.5rem', paddingLeft: '1.5rem', marginBottom: '2rem', flex: 1 }}>
                <li style={{ marginBottom: '0.8rem' }}><strong>Tudo do Start your English</strong></li>
                <li style={{ marginBottom: '0.8rem' }}>2 Lives Semanais ao vivo</li>
                <li style={{ marginBottom: '0.8rem' }}>Acesso total ao Chat Global na plataforma (pode interagir com a turma)</li>
                <li style={{ marginBottom: '0.8rem' }}>Calendário de aulas ativo na plataforma</li>
              </ul>
              <a href="#" className="btn-primary" style={{ display: 'block', textAlign: 'center', background: '#ccc', color: '#666', boxShadow: 'none' }}>Em Breve</a>
            </motion.div>

            <motion.div className="lp-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🥇</div>
              <h3 style={{ color: 'var(--primary-blue)', fontSize: '1.5rem' }}>Becoming Fluent</h3>
              <ul style={{ color: '#4b5563', textAlign: 'left', marginTop: '1.5rem', paddingLeft: '1.5rem', marginBottom: '2rem', flex: 1 }}>
                <li style={{ marginBottom: '0.8rem' }}><strong>Tudo do English Evolution</strong></li>
                <li style={{ marginBottom: '0.8rem' }}>1 Aula semanal em grupo fechado (até 8 pessoas)</li>
                <li style={{ marginBottom: '0.8rem' }}>Chat Direto com o Teacher 24/7 liberado na plataforma</li>
              </ul>
              <a href="#" className="btn-primary" style={{ display: 'block', textAlign: 'center', background: '#ccc', color: '#666', boxShadow: 'none' }}>Em Breve</a>
            </motion.div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="depoimentos" className="lp-testimonials">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: '2.5rem', color: 'var(--primary-blue)' }}
          >
            O que meus alunos dizem
          </motion.h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', marginTop: '1rem' }}>Resultados reais de quem já transformou o inglês com a minha metodologia.</p>
          
          <div className="lp-videos-grid">
            {[
              { id: 1, name: "Ricardo", role: "Membro há 3 meses", video: "depoimento1.mp4" },
              { id: 2, name: "Em breve", role: "Aluno(a)", video: null },
              { id: 3, name: "Em breve", role: "Aluno(a)", video: null }
            ].map((testimonial, i) => (
              <motion.div key={testimonial.id} className="lp-video-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                {testimonial.video ? (
                  <TestimonialVideo src={`/${testimonial.video}`} name={testimonial.name} role={testimonial.role} />
                ) : (
                  <div className="lp-video-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}><path d="M8 5v14l11-7z"/></svg>
                    <span>Espaço para Vídeo</span>
                    <span style={{ fontSize: '0.8rem' }}>(1080x1920)</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="lp-faq">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: '2.5rem', color: 'var(--primary-blue)' }}
          >
            Perguntas Frequentes
          </motion.h2>
          
          <div className="lp-faq-container">
            {[
              { q: "As aulas são em grupo ou individuais?", a: "O foco é na sua evolução, por isso o acompanhamento é 100% individual. O portal e os materiais são desenhados exclusivamente para os seus objetivos." },
              { q: "Como funciona a plataforma do aluno?", a: "Ao iniciar as aulas, você ganha acesso vitalício ao portal onde poderá ver suas tarefas, link do meet para a aula, e acessar os materiais em PDF. Há também um chat direto para tirar dúvidas comigo a qualquer hora!" },
              { q: "Preciso ter conhecimento prévio de inglês?", a: "Absolutamente não! O curso atende desde o zero absoluto até a fluência avançada. O material é nivelado de acordo com seu ritmo." },
              { q: "Qual a duração das aulas?", a: "Geralmente nossas aulas têm duração de 1 hora, mas o ritmo é adaptado conforme a sua necessidade e disponibilidade de tempo." },
              { q: "Como faço para começar?", a: "É simples! Clique no botão de falar comigo no WhatsApp, vamos bater um papo, agendar uma aula experimental e definir seu plano de estudos." }
            ].map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>
        </section>

      </main>

      {/* FLOATING WHATSAPP BUTTON */}
      <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" style={{ position: 'fixed', bottom: '30px', right: '30px', background: '#25D366', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 999, transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Fale comigo no WhatsApp">
         <svg width="35" height="35" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.128.552 4.148 1.6 5.945L.234 23.355l5.526-1.448a12.025 12.025 0 006.271 1.748h.001c6.646 0 12.03-5.385 12.03-12.031S18.677 0 12.031 0zM12.03 21.644h-.001a10.021 10.021 0 01-5.111-1.393l-.366-.217-3.799.996.998-3.71-.238-.378a10.02 10.02 0 01-1.534-5.334c0-5.534 4.503-10.038 10.037-10.038 5.533 0 10.036 4.504 10.036 10.038s-4.503 10.036-10.036 10.036zM17.534 14.15c-.302-.15-1.785-.88-2.062-.98-.277-.1-.479-.15-.68.15-.202.3-.778.98-.955 1.18-.176.2-.353.225-.655.075-.302-.15-1.275-.47-2.428-1.5-.898-.802-1.503-1.792-1.68-2.092-.176-.3-.019-.462.132-.612.135-.135.302-.35.453-.525.15-.175.2-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.68-1.642-.931-2.25-.245-.592-.494-.512-.68-.521-.175-.008-.377-.008-.578-.008-.202 0-.528.075-.805.375-.277.3-1.057 1.034-1.057 2.52s1.083 2.918 1.234 3.118c.15.2 2.122 3.242 5.143 4.545.719.31 1.28.495 1.718.634.721.23 1.378.197 1.896.119.58-.088 1.785-.73 2.036-1.436.252-.706.252-1.31.176-1.436-.075-.126-.277-.201-.579-.351z"/></svg>
      </a>

      <footer className="lp-footer">
        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Pronto para o próximo passo?</h2>
        <p style={{ marginBottom: '2rem', color: 'rgba(255,255,255,0.8)' }}>Entre em contato hoje e agende sua primeira aula.</p>
        <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '12px 32px' }}>
          Falar com Teacher Gus
        </a>
        <div style={{ marginTop: '4rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Gus English School. Todos os direitos reservados.
        </div>
      </footer>
    </>
  );
}
