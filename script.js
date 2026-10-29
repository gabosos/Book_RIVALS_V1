(() => {
  const bookArea = document.querySelector("#bookArea");
  const cover = document.querySelector("#cover");
  const backCover = document.querySelector("#backCover");
  const pageTurn = document.querySelector("#pageTurn");
  const turnFront = pageTurn.querySelector(".page-turn-front");
  const turnBack = pageTurn.querySelector(".page-turn-back");
  const counter = document.querySelector("#counter");
  const statusText = document.querySelector("#statusText");
  const previousButton = document.querySelector("#previousButton");
  const nextButton = document.querySelector("#nextButton");
  const edgePrevious = document.querySelector("#edgePrevious");
  const edgeNext = document.querySelector("#edgeNext");
  const pageElements = [...document.querySelectorAll(".page:not(.page-turn-face)")];
  const mobileReader = window.matchMedia("(max-width: 520px)");
  const turnDuration = 850;
  const states = ["cover", "inside-one", "inside-two", "back"];
  const statusLabels = [
    "Portada",
    "Leyendo · Página 1 de 2",
    "Leyendo · Página 2 de 2",
    "Contraportada",
  ];
  let currentPage = 0;
  let isTurning = false;
  let touchStartX = null;
  let turnTimer;

  function render() {
    const state = states[currentPage];
    const isBackCover = state === "back";
    const visiblePages = state === "inside-two"
      ? pageElements
      : state === "inside-one"
        ? [pageElements[0]]
        : [];

    bookArea.dataset.state = state;
    bookArea.dataset.settled = String(!isTurning);
    cover.classList.toggle("is-open", currentPage > 0);
    backCover.classList.toggle("is-visible", isBackCover);

    pageElements.forEach((page) => {
      const isVisible = visiblePages.includes(page);
      page.inert = !isVisible;
      page.setAttribute("aria-hidden", String(!isVisible));
    });

    counter.textContent = String(currentPage > 1 ? 2 : 1).padStart(2, "0");
    statusText.textContent = statusLabels[currentPage];
    previousButton.disabled = currentPage === 0 || isTurning;
    edgePrevious.disabled = currentPage === 0 || isTurning;
    nextButton.disabled = currentPage === states.length - 1 || isTurning;
    edgeNext.disabled = currentPage === states.length - 1 || isTurning;

    const nextLabels = [
      ["Leer página 1 →", "Abrir el libro y leer la página 1"],
      ["Página 2 →", "Pasar a la página 2"],
      ["Contraportada →", "Pasar a la contraportada"],
      ["Fin del libro", "Estás en la última página"],
    ];
    nextButton.textContent = nextLabels[currentPage][0];
    nextButton.setAttribute("aria-label", nextLabels[currentPage][1]);
    cover.setAttribute("aria-label", currentPage === 0 ? "Abrir el libro" : "Volver a la página anterior");
  }

  function clearPageTurn() {
    window.clearTimeout(turnTimer);
    pageTurn.classList.remove("is-active", "is-turning-forward", "is-turning-backward");
    pageTurn.style.transition = "";
    pageTurn.style.transform = "";
  }

  function animatePageTurn(sourcePage, direction) {
    const content = sourcePage.innerHTML;
    turnFront.innerHTML = content;
    turnBack.innerHTML = content;
    pageTurn.classList.remove("is-turning-forward", "is-turning-backward");
    pageTurn.style.transition = "none";
    pageTurn.style.transform = "rotateY(0)";
    pageTurn.classList.add("is-active");
    pageTurn.getBoundingClientRect();
    pageTurn.style.transition = "";

    window.requestAnimationFrame(() => {
      pageTurn.classList.add(direction === "forward" ? "is-turning-forward" : "is-turning-backward");
    });
  }

  function turnTo(nextPage) {
    if (isTurning || nextPage < 0 || nextPage >= states.length || nextPage === currentPage) return;

    const previousPage = currentPage;
    isTurning = true;
    currentPage = nextPage;
    render();

    if (nextPage === previousPage + 1 && previousPage === 1) {
      animatePageTurn(pageElements[0], "forward");
    } else if (nextPage === previousPage + 1 && previousPage === 2) {
      animatePageTurn(pageElements[1], "forward");
    } else if (nextPage === previousPage - 1 && previousPage === 2) {
      animatePageTurn(pageElements[1], "backward");
    }

    turnTimer = window.setTimeout(() => {
      clearPageTurn();
      isTurning = false;
      render();
    }, turnDuration);
  }

  function next() {
    turnTo(currentPage + 1);
  }

  function previous() {
    turnTo(currentPage - 1);
  }

  nextButton.addEventListener("click", next);
  edgeNext.addEventListener("click", next);
  previousButton.addEventListener("click", previous);
  edgePrevious.addEventListener("click", previous);

  cover.addEventListener("click", () => {
    if (currentPage === 0) next();
    else if (currentPage < states.length - 1) previous();
  });
  backCover.addEventListener("click", previous);

  for (const element of [cover, backCover]) {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        element.click();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
  });

  bookArea.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  bookArea.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) distance < 0 ? next() : previous();
    touchStartX = null;
  }, { passive: true });

  mobileReader.addEventListener("change", () => {
    if (!isTurning) return;
    clearPageTurn();
    isTurning = false;
    render();
  });

  render();
})();
