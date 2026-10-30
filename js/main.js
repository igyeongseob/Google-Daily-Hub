const experiences = {
  news: {
    title: "뉴스 제작",
    subtitle: "뉴스 제작 경험",
    period: "2026.05 — 08",
    role: "음향 감독",
    challenge: "한 팀원이 맡은 역할과 업무를 책임감 있게 수행하지 않아 작업에 차질이 생겼습니다.",
    response: "팀원과 소통하며 업무를 재분배하고, 부족한 부분을 보완했습니다. 함께 마무리해 제출 기한에 맞출 수 있었습니다.",
    learning: "팀 프로젝트에서는 개인의 역량뿐 아니라 책임감과 원활한 소통이 중요하다는 점을 배웠습니다. 예상하지 못한 문제가 생겨도 팀원들과 협력하고 유연하게 대처하는 자세가 필요하다는 것을 알게 되었습니다."
  },
  duolingo: {
    title: "듀오링고 모션 그래픽",
    subtitle: "모션 그래픽 광고 제작",
    period: "2026.08 — 2026.10",
    role: "모션 그래픽 제작",
    challenge: "진행 상황과 의견을 충분히 공유하지 못해 제작 방향에 차이가 생겼고, 프로젝트 진행에 어려움이 있었습니다.",
    response: "먼저 진행 상황과 서로의 의견을 나누자고 제안했습니다. 충분히 대화해 공통된 제작 방향을 정하고, 함께 협력해 문제를 해결했습니다.",
    learning: "팀 프로젝트에서는 원활한 소통과 협력이 중요합니다. 서로의 진행 상황을 공유하는 일이 함께 결과를 만들어가는 기반이라는 점을 배웠습니다."
  }
};

const dialog = document.querySelector(".project-dialog");
const dialogContent = document.querySelector(".dialog-content");
const closeButton = document.querySelector(".dialog-close");
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
let lastTrigger = null;

function renderExperience(experience) {
  dialogContent.innerHTML = `
    <p class="dialog-eyebrow">MEDIA PRODUCTION · TEAMWORK</p>
    <h2 id="dialog-title">${experience.title}</h2>
    <p class="dialog-subtitle">${experience.subtitle}</p>
    <div class="dialog-facts">
      <span class="dialog-fact"><b>기간</b>${experience.period}</span>
      <span class="dialog-fact"><b>역할</b>${experience.role}</span>
      <span class="dialog-fact"><b>구분</b>미디어 제작 경험</span>
    </div>
    <section class="detail-block"><h3>마주한 어려움</h3><p>${experience.challenge}</p></section>
    <section class="detail-block"><h3>함께 해결한 방법</h3><p>${experience.response}</p></section>
    <section class="detail-block takeaway"><h3>배운 점</h3><p>${experience.learning}</p></section>`;
}

document.querySelectorAll(".project-open").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const experience = experiences[trigger.dataset.project];
    if (!experience) return;
    lastTrigger = trigger;
    renderExperience(experience);
    dialog.showModal();
    document.body.classList.add("dialog-open");
    closeButton.focus();
  });
});

function closeDialog() {
  if (dialog.open) dialog.close();
}

closeButton.addEventListener("click", closeDialog);
dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  if (lastTrigger) lastTrigger.focus();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "메뉴 열기" : "메뉴 닫기");
  primaryNav.classList.toggle("is-open", !isOpen);
});

primaryNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "메뉴 열기");
    primaryNav.classList.remove("is-open");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && primaryNav.classList.contains("is-open")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "메뉴 열기");
    primaryNav.classList.remove("is-open");
    menuToggle.focus();
  }
});
