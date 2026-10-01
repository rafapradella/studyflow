/* =====================================================
   STUDYFLOW
   Sistema de controle de progresso acadêmico
===================================================== */

const STORAGE_KEY = "studyflow_data_v1";


/* =====================================================
   ESTRUTURA INICIAL
===================================================== */

const defaultData = {

  course: {
    name: "",
    startDate: "",
    deadline: ""
  },

  modules: []

};


let data = loadData();


/* =====================================================
   LOCAL STORAGE
===================================================== */

function loadData() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {

      return normalize(
        JSON.parse(saved)
      );

    }

    return structuredClone(defaultData);

  } catch (error) {

    console.error(error);

    return structuredClone(defaultData);

  }

}


function normalize(obj) {

  obj.course ||= {
    name: "",
    startDate: "",
    deadline: ""
  };


  obj.modules ||= [];


  obj.modules.forEach(module => {

    module.id ||= uid();

    module.name ||= "Novo módulo";

    module.disciplines ||= [];


    module.disciplines.forEach(discipline => {

      discipline.id ||= uid();

      discipline.name ||= "Nova disciplina";

      discipline.lessons ||= [];


      discipline.lessons.forEach(lesson => {

        lesson.id ||= uid();

        lesson.name ||= "Nova aula";

        lesson.done = !!lesson.done;

      });

    });

  });


  return obj;

}


function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}


/* =====================================================
   ID
===================================================== */

function uid() {

  return Math.random()
    .toString(36)
    .slice(2, 10);

}


/* =====================================================
   SEGURANÇA / HTML
===================================================== */

function escapeHtml(value = "") {

  return String(value).replace(
    /[&<>"']/g,

    character => ({

      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"

    }[character])

  );

}


/* =====================================================
   AULAS
===================================================== */

function allLessons() {

  return data.modules.flatMap(module =>

    module.disciplines.flatMap(discipline =>

      discipline.lessons.map(lesson => ({

        ...lesson,

        moduleId: module.id,

        moduleName: module.name,

        disciplineId: discipline.id,

        disciplineName: discipline.name

      }))

    )

  );

}


/* =====================================================
   CONTADORES
===================================================== */

function countDone(list) {

  return list.filter(
    item => item.done
  ).length;

}


function percent(done, total) {

  if (!total) {
    return 0;
  }

  return Math.round(
    (done / total) * 100
  );

}


/* =====================================================
   ESTATÍSTICAS DO MÓDULO
===================================================== */

function moduleStats(module) {

  const lessons =
    module.disciplines.flatMap(
      discipline => discipline.lessons
    );


  const done =
    countDone(lessons);


  return {

    total: lessons.length,

    done: done,

    pct: percent(
      done,
      lessons.length
    )

  };

}


/* =====================================================
   DATAS
===================================================== */

function startOfDay(date) {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}


function daysRemaining() {

  if (!data.course.deadline) {

    return null;

  }


  const today =
    startOfDay(new Date());


  const deadline =
    startOfDay(
      new Date(
        data.course.deadline + "T00:00:00"
      )
    );


  return Math.ceil(
    (deadline - today) /
    86400000
  );

}


function formatDate(dateString) {

  if (!dateString) {

    return "";

  }


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(
    new Date(
      dateString + "T00:00:00"
    )
  );

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

  const toast =
    document.getElementById("toast");


  toast.textContent = message;

  toast.classList.add("show");


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 1800);

}


/* =====================================================
   NAVEGAÇÃO
===================================================== */

function switchView(view) {

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.view === view
      );

    });


  document
    .querySelectorAll(".view")
    .forEach(section => {

      section.classList.remove(
        "active"
      );

    });


  document
    .getElementById(
      view + "View"
    )
    .classList.add("active");


  document.getElementById(
    "pageTitle"
  ).textContent =
    view === "dashboard"
      ? "Dashboard"
      : "Configurações";


  document.getElementById(
    "pageEyebrow"
  ).textContent =
    view === "dashboard"
      ? "VISÃO GERAL"
      : "GERENCIAMENTO";


  document
    .getElementById("sidebar")
    .classList.remove("open");


  if (view === "dashboard") {

    renderDashboard();

  } else {

    renderSettings();

  }

}


/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {

  const lessons =
    allLessons();


  const done =
    countDone(lessons);


  const total =
    lessons.length;


  const pct =
    percent(done, total);


  const hasCourse =
    !!data.course.name ||
    data.modules.length > 0;


  const dashboardEmpty =
    document.getElementById(
      "dashboardEmpty"
    );


  const dashboardContent =
    document.getElementById(
      "dashboardContent"
    );


  dashboardEmpty.classList.toggle(
    "hidden",
    hasCourse
  );


  dashboardContent.classList.toggle(
    "hidden",
    !hasCourse
  );


  if (!hasCourse) {

    return;

  }


  /* CURSO */

  document.getElementById(
    "courseName"
  ).textContent =
    data.course.name ||
    "Meu curso";


  document.getElementById(
    "deadlineText"
  ).textContent =

    data.course.deadline

      ? `Prazo de conclusão: ${formatDate(
          data.course.deadline
        )}`

      : "Defina o prazo do curso nas configurações.";


  document.getElementById(
    "coursePercent"
  ).textContent =
    pct + "%";


  /* ESTATÍSTICAS */

  document.getElementById(
    "statProgress"
  ).textContent =
    pct + "%";


  document.getElementById(
    "statProgressDetail"
  ).textContent =
    `${done} de ${total} aulas`;


  document.getElementById(
    "statRemaining"
  ).textContent =
    Math.max(
      total - done,
      0
    );


  /* PRAZO */

  const days =
    daysRemaining();


  const daysElement =
    document.getElementById(
      "statDays"
    );


  const daysDetail =
    document.getElementById(
      "statDaysDetail"
    );


  if (days === null) {

    daysElement.textContent = "—";

    daysDetail.textContent =
      "defina uma data";

  }

  else if (days < 0) {

    daysElement.textContent =
      Math.abs(days);

    daysDetail.textContent =
      "dias após o prazo";

  }

  else if (days === 0) {

    daysElement.textContent =
      "Hoje";

    daysDetail.textContent =
      "prazo de conclusão";

  }

  else {

    daysElement.textContent =
      days;

    daysDetail.textContent =
      "dias restantes";

  }


  /* RITMO */

  const remaining =
    total - done;


  const pace =

    days !== null &&
    days > 0

      ? Math.ceil(
          remaining /
          days *
          100
        ) / 100

      : null;


  document.getElementById(
    "statPace"
  ).textContent =

    pace === null

      ? "—"

      : pace.toLocaleString(
          "pt-BR",
          {
            maximumFractionDigits: 2
          }
        );


  /* CÍRCULO */

  const degrees =
    pct * 3.6;


  document.querySelector(
    ".progress-ring"
  ).style.background =

    `conic-gradient(
      var(--accent)
      ${degrees}deg,
      #e5e7eb
      ${degrees}deg
    )`;


  /* MÓDULOS */

  const moduleList =
    document.getElementById(
      "moduleProgressList"
    );


  if (!data.modules.length) {

    moduleList.innerHTML = `
      <div class="empty-mini">
        Nenhum módulo cadastrado.
      </div>
    `;

  }

  else {

    moduleList.innerHTML =
      data.modules.map(module => {

        const stats =
          moduleStats(module);


        return `

          <div class="module-row">

            <div class="module-title">

              <span>
                ${escapeHtml(module.name)}
              </span>

              <span>
                ${stats.pct}%
                ·
                ${stats.done}/${stats.total}
              </span>

            </div>


            <div class="progress-track">

              <div
                class="progress-fill"
                style="width:${stats.pct}%">
              </div>

            </div>

          </div>

        `;

      }).join("");

  }


  /* PRÓXIMAS AULAS */

  const nextLessons =
    lessons
      .filter(lesson => !lesson.done)
      .slice(0, 6);


  const nextElement =
    document.getElementById(
      "nextLessons"
    );


  if (nextLessons.length) {

    nextElement.innerHTML =
      nextLessons.map(lesson => `

        <div class="lesson-item">

          <input
            type="checkbox"
            data-lesson-id="${lesson.id}"
            data-discipline-id="${lesson.disciplineId}"
            data-module-id="${lesson.moduleId}"
          >

          <label>

            ${escapeHtml(lesson.name)}

            <span class="lesson-meta">

              ${escapeHtml(
                lesson.moduleName
              )}

              ·

              ${escapeHtml(
                lesson.disciplineName
              )}

            </span>

          </label>

        </div>

      `).join("");

  }

  else {

    nextElement.innerHTML =

      total

        ? `
          <div class="empty-mini">
            Todas as aulas foram concluídas.
          </div>
        `

        : `
          <div class="empty-mini">
            Cadastre aulas nas configurações.
          </div>
        `;

  }

}


/* =====================================================
   CONFIGURAÇÕES
===================================================== */

function renderSettings() {

  document.getElementById(
    "courseInput"
  ).value =
    data.course.name || "";


  document.getElementById(
    "startDateInput"
  ).value =
    data.course.startDate || "";


  document.getElementById(
    "deadlineInput"
  ).value =
    data.course.deadline || "";


  const root =
    document.getElementById(
      "structureEditor"
    );


  if (!data.modules.length) {

    root.innerHTML = `

      <div class="empty-mini">

        Nenhum módulo cadastrado.

        Clique em
        “+ Novo módulo”
        para começar.

      </div>

    `;

    return;

  }


  root.innerHTML =
    data.modules.map(
      (module, moduleIndex) => `

        <div
          class="module-editor"
          data-module="${module.id}">


          <!-- CABEÇALHO DO MÓDULO -->

          <div class="module-editor-head">

            <span class="label">

              ${String(
                moduleIndex + 1
              ).padStart(2, "0")}

            </span>


            <input
              value="${escapeHtml(
                module.name
              )}"
              data-action="module-name"
              data-module-id="${module.id}"
            >


            <div class="mini-actions">

              <button
                class="mini-btn"
                data-action="add-discipline"
                data-module-id="${module.id}">

                + Disciplina

              </button>


              <button
                class="mini-btn danger"
                data-action="delete-module"
                data-module-id="${module.id}">

                Excluir

              </button>

            </div>

          </div>


          <!-- DISCIPLINAS -->

          <div class="discipline-list">

            ${
              module.disciplines.length

                ?

                module.disciplines.map(
                  (
                    discipline,
                    disciplineIndex
                  ) => `

                    <div class="discipline-editor">


                      <div class="discipline-head">

                        <span class="label">

                          ${disciplineIndex + 1}.

                        </span>


                        <input
                          value="${escapeHtml(
                            discipline.name
                          )}"
                          data-action="discipline-name"
                          data-module-id="${module.id}"
                          data-discipline-id="${discipline.id}"
                        >


                        <button
                          class="mini-btn"
                          data-action="delete-discipline"
                          data-module-id="${module.id}"
                          data-discipline-id="${discipline.id}">

                          Excluir

                        </button>

                      </div>


                      <!-- AULAS -->

                      <div class="lessons-editor">

                        ${
                          discipline.lessons.map(
                            (
                              lesson,
                              lessonIndex
                            ) => `

                              <div class="lesson-edit">

                                <span class="label">

                                  ${lessonIndex + 1}.

                                </span>


                                <input
                                  value="${escapeHtml(
                                    lesson.name
                                  )}"
                                  data-action="lesson-name"
                                  data-module-id="${module.id}"
                                  data-discipline-id="${discipline.id}"
                                  data-lesson-id="${lesson.id}"
                                >


                                <button
                                  class="mini-btn danger"
                                  data-action="delete-lesson"
                                  data-module-id="${module.id}"
                                  data-discipline-id="${discipline.id}"
                                  data-lesson-id="${lesson.id}">

                                  ×

                                </button>

                              </div>

                            `
                          ).join("")
                        }


                        <button
                          class="add-line"
                          data-action="add-lesson"
                          data-module-id="${module.id}"
                          data-discipline-id="${discipline.id}">

                          + Adicionar aula

                        </button>

                      </div>

                    </div>

                  `
                ).join("")

                :

                `

                  <div class="empty-mini">

                    Nenhuma disciplina neste módulo.

                  </div>

                `
            }

          </div>

        </div>

      `
    ).join("");

}


/* =====================================================
   BUSCAS
===================================================== */

function findModule(id) {

  return data.modules.find(
    module => module.id === id
  );

}


function findDiscipline(
  moduleId,
  disciplineId
) {

  return findModule(
    moduleId
  )?.disciplines.find(
    discipline =>
      discipline.id === disciplineId
  );

}


function findLesson(
  moduleId,
  disciplineId,
  lessonId
) {

  return findDiscipline(
    moduleId,
    disciplineId
  )?.lessons.find(
    lesson =>
      lesson.id === lessonId
  );

}


/* =====================================================
   ADICIONAR MÓDULO
===================================================== */

function addModule() {

  data.modules.push({

    id: uid(),

    name:
      `Módulo ${data.modules.length + 1}`,

    disciplines: []

  });


  saveData();

  renderSettings();

  showToast(
    "Módulo criado"
  );

}


/* =====================================================
   MARCAR AULA
===================================================== */

function toggleLesson(
  moduleId,
  disciplineId,
  lessonId,
  done
) {

  const lesson =
    findLesson(
      moduleId,
      disciplineId,
      lessonId
    );


  if (!lesson) {

    return;

  }


  lesson.done =
    done;


  saveData();

  renderDashboard();

}


/* =====================================================
   CLIQUES
===================================================== */

document.addEventListener(
  "click",
  event => {


    /* NAVEGAÇÃO */

    const nav =
      event.target.closest(
        ".nav-item"
      );


    if (nav) {

      switchView(
        nav.dataset.view
      );

    }


    /* CONFIGURAÇÕES */

    if (
      event.target.id ===
      "goSettings"
    ) {

      switchView(
        "settings"
      );

    }


    if (
      event.target.id ===
      "manageCourse"
    ) {

      switchView(
        "settings"
      );

    }


    if (
      event.target.id ===
      "emptySettings"
    ) {

      switchView(
        "settings"
      );

    }


    /* MENU MOBILE */

    if (
      event.target.id ===
      "mobileMenu"
    ) {

      document
        .getElementById(
          "sidebar"
        )
        .classList.toggle(
          "open"
        );

    }


    /* NOVO MÓDULO */

    if (
      event.target.id ===
      "addModule"
    ) {

      addModule();

    }


    /* AÇÕES DA ESTRUTURA */

    const actionElement =
      event.target.closest(
        "[data-action]"
      );


    if (!actionElement) {

      return;

    }


    const action =
      actionElement.dataset.action;


    const moduleId =
      actionElement.dataset.moduleId;


    const disciplineId =
      actionElement.dataset.disciplineId;


    const lessonId =
      actionElement.dataset.lessonId;


    /* NOVA DISCIPLINA */

    if (
      action ===
      "add-discipline"
    ) {

      const module =
        findModule(
          moduleId
        );


      if (module) {

        module.disciplines.push({

          id: uid(),

          name:
            `Disciplina ${
              module.disciplines.length + 1
            }`,

          lessons: []

        });

      }


      saveData();

      renderSettings();

      showToast(
        "Disciplina criada"
      );

    }


    /* NOVA AULA */

    if (
      action ===
      "add-lesson"
    ) {

      const discipline =
        findDiscipline(
          moduleId,
          disciplineId
        );


      if (discipline) {

        discipline.lessons.push({

          id: uid(),

          name:
            `Aula ${
              discipline.lessons.length + 1
            }`,

          done: false

        });

      }


      saveData();

      renderSettings();

      showToast(
        "Aula criada"
      );

    }


    /* EXCLUIR MÓDULO */

    if (
      action ===
      "delete-module"
    ) {

      if (
        confirm(
          "Excluir este módulo e todo o seu conteúdo?"
        )
      ) {

        data.modules =
          data.modules.filter(
            module =>
              module.id !== moduleId
          );


        saveData();

        renderSettings();

        renderDashboard();

      }

    }


    /* EXCLUIR DISCIPLINA */

    if (
      action ===
      "delete-discipline"
    ) {

      if (
        confirm(
          "Excluir esta disciplina e suas aulas?"
        )
      ) {

        const module =
          findModule(
            moduleId
          );


        if (module) {

          module.disciplines =
            module.disciplines.filter(
              discipline =>
                discipline.id !==
                disciplineId
            );

        }


        saveData();

        renderSettings();

        renderDashboard();

      }

    }


    /* EXCLUIR AULA */

    if (
      action ===
      "delete-lesson"
    ) {

      const discipline =
        findDiscipline(
          moduleId,
          disciplineId
        );


      if (discipline) {

        discipline.lessons =
          discipline.lessons.filter(
            lesson =>
              lesson.id !==
              lessonId
          );

      }


      saveData();

      renderSettings();

      renderDashboard();

    }

  }
);


/* =====================================================
   ALTERAÇÕES DOS CAMPOS
===================================================== */

document.addEventListener(
  "change",
  event => {


    /* CHECKBOX DA AULA */

    if (
      event.target.type ===
        "checkbox" &&
      event.target.dataset.lessonId
    ) {

      toggleLesson(

        event.target.dataset.moduleId,

        event.target.dataset.disciplineId,

        event.target.dataset.lessonId,

        event.target.checked

      );


      return;

    }


    const action =
      event.target.dataset.action;


    if (!action) {

      return;

    }


    /* NOME DO MÓDULO */

    if (
      action ===
      "module-name"
    ) {

      const module =
        findModule(
          event.target.dataset.moduleId
        );


      if (module) {

        module.name =
          event.target.value.trim() ||
          "Sem nome";


        saveData();

        renderDashboard();

      }

    }


    /* NOME DA DISCIPLINA */

    if (
      action ===
      "discipline-name"
    ) {

      const discipline =
        findDiscipline(

          event.target.dataset.moduleId,

          event.target.dataset.disciplineId

        );


      if (discipline) {

        discipline.name =
          event.target.value.trim() ||
          "Sem nome";


        saveData();

        renderDashboard();

      }

    }


    /* NOME DA AULA */

    if (
      action ===
      "lesson-name"
    ) {

      const lesson =
        findLesson(

          event.target.dataset.moduleId,

          event.target.dataset.disciplineId,

          event.target.dataset.lessonId

        );


      if (lesson) {

        lesson.name =
          event.target.value.trim() ||
          "Sem nome";


        saveData();

        renderDashboard();

      }

    }

  }
);


/* =====================================================
   SALVAR CURSO
===================================================== */

document
  .getElementById(
    "saveCourse"
  )
  .addEventListener(
    "click",
    () => {


      data.course.name =
        document.getElementById(
          "courseInput"
        ).value.trim();


      data.course.startDate =
        document.getElementById(
          "startDateInput"
        ).value;


      data.course.deadline =
        document.getElementById(
          "deadlineInput"
        ).value;


      saveData();

      renderDashboard();

      showToast(
        "Informações salvas"
      );

    }
  );


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

renderDashboard();