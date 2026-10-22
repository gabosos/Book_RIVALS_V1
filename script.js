      (() => {
        const bookArea = document.querySelector("#bookArea");
        const cover = document.querySelector("#cover");
        const backCover = document.querySelector("#backCover");
        const counter = document.querySelector("#counter");
        const statusText = document.querySelector("#statusText");
        const previousButton = document.querySelector("#previousButton");
        const nextButton = document.querySelector("#nextButton");
        const edgePrevious = document.querySelector("#edgePrevious");
        const edgeNext = document.querySelector("#edgeNext");
        const pageElements = [...document.querySelectorAll(".page")];
        const mobileReader = window.matchMedia("(max-width: 520px)");
        let currentPage = 0;
        let isTurning = false;
        let touchStartX = null;
        let turnTimer;
        let wasMobile = mobileReader.matches;

        function render() {
          const states = mobileReader.matches
            ? ["cover", "inside-one", "inside-two", "back"]
            : ["cover", "inside", "back"];
          const state = states[currentPage];
          const isBackCover = state === "back";
          const pageCount = states.length;
          bookArea.dataset.state = state;
          cover.classList.toggle("is-open", currentPage > 0);
          backCover.classList.toggle("is-visible", isBackCover);
          pageElements.forEach((page, index) => {
            const isVisiblePage = state === "inside"
              || (state === "inside-one" && index === 0)
              || (state === "inside-two" && index === 1);
            page.inert = mobileReader.matches && !isVisiblePage;
            page.setAttribute("aria-hidden", String(mobileReader.matches && !isVisiblePage));
          });
          const displayedPage = state === "inside-two" || isBackCover || state === "inside" ? 2 : 1;
          counter.textContent = String(displayedPage).padStart(2, "0");
          statusText.textContent = isBackCover
            ? "Contraportada"
            : state === "inside-one"
              ? "Leyendo · Página 1 de 2"
              : state === "inside-two"
                ? "Leyendo · Página 2 de 2"
                : state === "inside"
                  ? "Leyendo · 2 páginas"
                  : "Portada";
          previousButton.disabled = currentPage === 0 || isTurning;
          edgePrevious.disabled = currentPage === 0 || isTurning;
          nextButton.disabled = currentPage === pageCount - 1 || isTurning;
          edgeNext.disabled = currentPage === pageCount - 1 || isTurning;
          nextButton.innerHTML = currentPage > 0
            ? `${mobileReader.matches && currentPage === 1 ? "Página 2" : "Terminar"} <span aria-hidden="true">→</span>`
            : 'Leer guía <span aria-hidden="true">→</span>';
          nextButton.setAttribute(
            "aria-label",
            currentPage === pageCount - 1
              ? "Ya estás en la contraportada"
              : currentPage === 0
                ? "Abrir el libro y leer la guía"
                : mobileReader.matches && currentPage === 1
                  ? "Pasar a la página 2"
                  : "Ir a la contraportada"
          );
          cover.setAttribute("aria-label", currentPage === 0 ? "Abrir el libro" : "Volver a la portada");
          backCover.setAttribute("aria-label", "Contraportada. Volver a la página anterior");
        }

        function turnTo(nextPage) {
          const lastPage = mobileReader.matches ? 3 : 2;
          if (isTurning || nextPage < 0 || nextPage > lastPage || nextPage === currentPage) return;
          isTurning = true;
          currentPage = nextPage;
          render();
          turnTimer = window.setTimeout(() => {
            isTurning = false;
            render();
          }, 850);
        }

        function next() {
          turnTo(currentPage + 1);
        }

        function previous() {
          if (currentPage > 0) turnTo(currentPage - 1);
        }

        nextButton.addEventListener("click", next);
        edgeNext.addEventListener("click", next);
        previousButton.addEventListener("click", previous);
        edgePrevious.addEventListener("click", previous);

        cover.addEventListener("click", () => {
          if (currentPage === 0) next();
          else if (currentPage < (mobileReader.matches ? 3 : 2)) previous();
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

        mobileReader.addEventListener("change", (event) => {
          if (event.matches === wasMobile) return;
          window.clearTimeout(turnTimer);
          isTurning = false;
          currentPage = event.matches
            ? currentPage === 0 ? 0 : currentPage === 2 ? 3 : currentPage
            : currentPage === 0 ? 0 : currentPage === 3 ? 2 : 1;
          wasMobile = event.matches;
          render();
        });

        render();
      })();

