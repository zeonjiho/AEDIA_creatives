import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Landing.module.css';
import logo from '../../Assets/logos/hyper-logo-title-w.svg';

const Landing = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.show);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(`.${styles.contentSection}, .${styles.ctaSection}`).forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src={logo} alt="HYPER" className={styles.logo} />
        <p className={styles.subtitle}>
          {/* 예술가들의 새로운 영감 */}
          New Inspiration for Artists
        </p>
        <div className={styles.authButtons}>
          <Link to="/login" className={styles.loginBtn}>
            {/* 로그인 */}
            Login
          </Link>
          <Link to="/signup" className={styles.signupBtn}>
            {/* 시작하기 */}
            Get Started
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={`${styles.contentSection} ${styles.leftAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 영감, 간직하세요 */}
              Capture Your Inspiration
            </h2>
            <p>
              {/* 흩어진 아이디어를 한곳에 모읍니다. 
              음악, 미술, 영화, 문학 등 당신의 예술적 스파크가 
              언제 어디서나 빛날 수 있도록, HYPER가 지켜드립니다. */}
              Gather your scattered ideas in one place.
              Let HYPER preserve your artistic spark in music,
              art, film, literature, and more, wherever you are.
            </p>
          </div>
          <div className={styles.imageContent}>
            <img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800" alt="예술적 영감" />
          </div>
        </section>
        <section className={`${styles.contentSection} ${styles.leftAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 복사하세요 */}
              Copy.
            </h2>
            <p>
              {/* 링크, 이미지, 텍스트부터 코드까지.
              당신이 수집하는 모든 디지털 콘텐츠를
              HYPER가 완벽하게 지원합니다. */}
              From links and images to text and code.
              HYPER perfectly supports all digital content
              you collect.
            </p>
          </div>
          <div className={styles.imageContent}>
            <div className={styles.modalDemo}>
              <div className={styles.masterHandlePreview}>
                <div className={styles.iconContainer}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.icon}>🔍</span>
                  </div>
                  <div className={styles.iconWrapper}>
                    <span className={styles.icon}>🎨</span>
                  </div>
                  <div className={`${styles.iconWrapper} ${styles.active}`}>
                    <span className={styles.icon}>+</span>
                    <div className={styles.tooltip}>
                      <span>Paste</span>
                      <span className={styles.shortcut}>⌘ + V</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.pasteModalPreview}>
                <div className={styles.modalContent}>
                  <div className={styles.typeSelector}>
                    <button className={`${styles.typeButton} ${styles.selected}`}>
                      <span className={styles.typeIcon}>🔗</span>
                      <span>Link</span>
                    </button>
                    <button className={styles.typeButton}>
                      <span className={styles.typeIcon}>🖼️</span>
                      <span>Image</span>
                    </button>
                    <button className={styles.typeButton}>
                      <span className={styles.typeIcon}>📝</span>
                      <span>Code</span>
                    </button>
                  </div>
                  <div className={styles.contentInput}>
                    <input type="text" placeholder="Paste your link here" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.contentSection} ${styles.rightAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 붙여넣으세요 */}
              And Paste.
            </h2>
            <p>
              {/* ⌘ + V 하나면 충분합니다.
              AI가 자동으로 콘텐츠를 분석하고
              최적화된 형태로 저장합니다. */}
              One ⌘ + V is all you need.
              AI automatically analyzes content
              and saves it in optimized form.
            </p>
          </div>
          <div className={styles.imageContent}>
            <img src="https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800" alt="붙여넣기 기능" />
          </div>
        </section>

        <section className={`${styles.contentSection} ${styles.leftAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 완성입니다 */}
              Done.
            </h2>
            <p>
              {/* 태그 추가, 컬렉션 정리, 검색까지
              모든 것이 자동화되어 있습니다.
              당신의 디지털 자산을 더 스마트하게 관리하세요. */}
              From adding tags to organizing collections and search,
              everything is automated.
              Manage your digital assets smarter.
            </p>
          </div>
          <div className={styles.imageContent}>
            <img src="https://images.unsplash.com/photo-1600267204091-5c1ab8b10c02?w=800" alt="자동화된 관리" />
          </div>
        </section>
        <section className={`${styles.contentSection} ${styles.rightAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 함께 나누고, 함께 도약 */}
              Share Together, Grow Together
            </h2>
            <p>
              {/* 전 세계 창작자들과 연결되어 
              서로의 컬렉션을 공유해보세요. 
              뜻이 맞는 이들과 협업하며 
              새로운 예술의 지평을 열 수 있습니다. */}
              Connect with creators worldwide and
              share your collections.
              Collaborate with like-minded artists
              to open new horizons in art.
            </p>
          </div>
          <div className={styles.imageContent}>
            <img src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800" alt="커뮤니티" />
          </div>
        </section>

        <section className={`${styles.contentSection} ${styles.leftAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 큐레이션도 예술입니다 */}
              Curation is an Art
            </h2>
            <p>
              {/* 이미지와 텍스트, 사운드를 하나의 테마로 엮어 
              당신만의 공간을 만드세요. 
              큐레이션의 과정 자체가 또 다른 창작이 됩니다. */}
              Create your own space by weaving images,
              text, and sound into a single theme.
              The process of curation itself becomes another form of creation.
            </p>
          </div>
          <div className={styles.imageContent}>
            {/* 큐레이션 이미지 추가 예정 */}
          </div>
        </section>

        <section className={`${styles.contentSection} ${styles.rightAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* AI로 확장되는 통찰 */}
              Insights Expanded by AI
            </h2>
            <p>
              {/* HYPER의 AI는 작품들의 흐름과 스타일, 
              시대적 맥락까지 파악해 깊이 있는 인사이트를 제공합니다. 
              숨겨진 연결고리를 발견하고 
              더 큰 영감을 얻어보세요. */}
              HYPER's AI analyzes the flow, style,
              and historical context of works to provide deep insights.
              Discover hidden connections and
              gain greater inspiration.
            </p>
          </div>
          <div className={styles.imageContent}>
            {/* AI 인사이트 이미지 추가 예정 */}
            {/* AI insight image to be added */}
          </div>
        </section>

        <section className={`${styles.contentSection} ${styles.leftAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 창작자를 위한 도구 */}
              Tools for Creators
            </h2>
            <p>
              {/* 무드보드, 레퍼런스, 프로젝트까지 
              예술적 과정을 한눈에 정리하세요. 
              아이디어를 쌓고, 이어가고, 
              언제든 다시 꺼내볼 수 있습니다. */}
              Organize your artistic process at a glance
              with moodboards, references, and projects.
              Build, connect, and revisit
              your ideas anytime.
            </p>
          </div>
          <div className={styles.imageContent}>
            {/* 도구 이미지 추가 예정 */}
            {/* Tools image to be added */}
          </div>
        </section>

        <section className={`${styles.contentSection} ${styles.rightAlign} ${styles.animate}`}>
          <div className={styles.textContent}>
            <h2>
              {/* 협업으로 완성되는 예술 */}
              Art Completed Through Collaboration
            </h2>
            <p>
              {/* 공유된 컬렉션을 통해 
              서로의 시선과 감각이 합쳐집니다. 
              혼자만의 창작을 넘어, 
              함께하는 예술을 경험해보세요. */}
              Through shared collections,
              perspectives and sensibilities merge.
              Go beyond solo creation and
              experience collaborative art.
            </p>
          </div>
          <div className={styles.imageContent}>
            {/* 협업 이미지 추가 예정 */}
            {/* Collaboration image to be added */}
          </div>
        </section>

        <section className={`${styles.ctaSection} ${styles.animate}`}>
          <h2>
            {/* 당신의 예술 여정, 지금 시작하세요 */}
            Begin Your Artistic Journey Now
          </h2>
          <p>
            {/* 깊이 있는 영감과 새로운 연결, 그리고 무한한 가능성 */}
            Deep inspiration, new connections, and infinite possibilities
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/signup" className={styles.signupBtn}>
              {/* 무료로 시작하기 */}
              Start Free
            </Link>
          </div>
        </section>
 
      </main>
    </div>
  );
};

export default Landing;
