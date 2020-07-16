//elementos DOM - variables
const items = document.getElementsByClassName("tabs__item");
const secciones = document.getElementsByClassName("tab-section");
const randomCatBtn = document.getElementById("random-cat-btn");
const breedSearchBtn = document.getElementById("breed-search-btn");
const tablaRazas = document.getElementById("breed-search-results");
const breedSearchInput = document.getElementById("breed-search-input");
const breedDropdown = document.getElementById("breed-dropdown");
const breedName = document.getElementById("breed-name");
const breedDescription = document.getElementById("breed-description");
const breedTemperament = document.getElementById("breed-temperament");
const breedImg = document.getElementById("breed-img");
const filtros = document.getElementsByClassName("breed-filter");
const breedResults = document.getElementById("breed-results");
const breedResultsCount = document.getElementById("breed-results-count");
let razas = [];
let filtrosSeleccionados = [];

//funciones
const resetMenu = () => {
  for (let index = 0; index < items.length; index++) {
    items[index].classList.remove("is-active");
  }
};

const resetSeccion = () => {
  for (let index = 0; index < secciones.length; index++) {
    secciones[index].classList.add("is-hidden");
  }
};

const spinner = (id, estado) => {
  const spinner = document.getElementById(`cat-spinner-${id}`);

  if (estado === "ocultar") {
    spinner.classList.remove("is-loading");
  } else {
    spinner.classList.add("is-loading");
  }
};

const crearDropdownRazas = () => {
  let html = "";

  razas.forEach((raza, index) => {
    html += `
    <option value="${raza.id}" ${index === 0 ? "selected" : ""}>${
      raza.name
    }</option>
    `;
  });
  breedDropdown.innerHTML = html;
};

const crearCardDeRazas = (razasFiltradas) => {
  let html = "";
  razasFiltradas.forEach((raza) => {
    html += `
     <div class="column is-6">
    <div class="card">
      <div class="card-image">
        <figure class="image is-4by3">
          <img src=${raza.imagen} alt="Placeholder image" />
        </figure>
      </div>
      <div class="card-content">
        <p class="title is-5">${raza.name}</p>
      </div>
    </div>
  </div>
    
    `;
  });

  breedResults.innerHTML = html;
};

const mostrarCantidadResultados = (cantidad) => {
  breedResultsCount.innerHTML = `${cantidad} resultados`;
};

const manejadorDeTabs = () => {
  for (let index = 0; index < items.length; index++) {
    items[index].addEventListener("click", (evento) => {
      const id = evento.target.getAttribute("href").substr(1);
      const seccion = document.getElementById(id);

      resetMenu();
      resetSeccion();

      evento.target.parentElement.classList.add("is-active");
      seccion.classList.remove("is-hidden");
    });
  }
};

const manejadorDeFiltros = () => {
  let razasFiltradas = [];
  for (let index = 0; index < filtros.length; index++) {
    filtros[index].addEventListener("click", (evento) => {
      if (evento.target.checked) {
        filtrosSeleccionados.push(evento.target.id);
      } else {
        const i = filtrosSeleccionados.indexOf(evento.target.id);
        if (i !== -1) {
          filtrosSeleccionados.splice(i, 1);
        }
      }

      razasFiltradas = razas.filter((raza) => {
        return filtrosSeleccionados.every((filtro) => {
          return raza[filtro] > 0;
        });
      });

      crearCardDeRazas(razasFiltradas);
      mostrarCantidadResultados(razasFiltradas.length);
    });
  }
};

const obtenerDataRandom = () => {
  const img = document.getElementById("cat-img");

  spinner("random", "mostrar");

  axios
    .get("https://api.thecatapi.com/v1/images/search/")
    .then((respuesta) => {
      const gato = respuesta.data[0];
      img.src = gato.url;
      img.onload = () => {
        spinner("random", "ocultar");
      };
    })
    .catch((error) => {
      spinner("random", "ocultar");
      alert(error);
    });
};

const obtenerImagen = (id) => {
  return axios
    .get(`https://api.thecatapi.com/v1/images/search?breed_ids=${id}`)
    .then((respuesta) => {
      let imagen = respuesta.data[0];
      imagen.breedId = id;
      return imagen;
    });
};

const obtenerRazas = () => {
  spinner("breeds", "mostrar");
  axios
    .get("https://api.thecatapi.com/v1/breeds")
    .then((respuesta) => {
      rzs = respuesta.data;

      return Promise.all(rzs.map((raza) => obtenerImagen(raza.id))).then(
        (respuestasImg) => {
          return rzs.map((raza) => {
            const imagen = respuestasImg.find((img) => img.breedId === raza.id);
            raza.imagen = imagen ? imagen.url : "";
            return raza;
          });
        }
      );
    })
    .then((respuesta) => {
      razas = respuesta;

      crearDropdownRazas();
      obtenerInfoDeRaza({
        target: {
          value: razas[0].id,
        },
      });
      crearCardDeRazas(razas);
      mostrarCantidadResultados(razas.length);
    })
    .catch((error) => {
      alert(error);
    })
    .finally(() => {
      spinner("breeds", "ocultar");
    });
};

const obtenerRazaPorNombre = () => {
  const busqueda = document.getElementById("breed-search-input").value;
  spinner("breeds-search", "mostrar");

  axios
    .get(`https://api.thecatapi.com/v1/breeds/search?q=${busqueda}`)
    .then((respuesta) => {
      const razas = respuesta.data;
      let html = "no hay resultados";

      if (razas.length > 0) {
        razas.forEach((raza) => {
          html += `
          <tr>
              <td>${raza.name}</td>
            </tr>
          `;
        });
      }

      tablaRazas.innerHTML = html;
    })
    .catch((error) => {
      alert(error);
    })
    .finally(() => {
      spinner("breeds-search", "ocultar");
    });
};

const obtenerInfoDeRaza = (evento) => {
  const id = evento.target.value;
  spinner("breeds", "mostrar");

  Promise.all([
    axios.get(`https://api.thecatapi.com/v1/breeds/${id}`),
    axios.get(`https://api.thecatapi.com/v1/images/search?breed_ids=${id}`),
  ])
    .then((respuesta) => {
      const info = respuesta[0].data;
      const img = respuesta[1].data[0];
      const temperamentos = info.temperament.split(",");
      let temperamentoHtml = "";

      temperamentos.forEach((temperamento) => {
        temperamentoHtml += `<span class="tag">${temperamento}</span>`;
      });

      breedName.innerHTML = info.name;
      breedDescription.innerHTML = info.description;
      breedTemperament.innerHTML = temperamentoHtml;
      breedImg.src = img.url;
      breedImg.onload = () => {
        spinner("breeds", "ocultar");
      };
    })
    .catch((error) => {
      alert(error);
    });
};

//manejador de eventos
randomCatBtn.addEventListener("click", obtenerDataRandom);

breedSearchBtn.addEventListener("click", obtenerRazaPorNombre);

breedSearchInput.addEventListener("keypress", (evento) => {
  if (evento.key === "Enter") {
    obtenerRazaPorNombre();
  }
});

breedDropdown.addEventListener("change", obtenerInfoDeRaza);

//inicializadores
manejadorDeTabs();
manejadorDeFiltros();
obtenerDataRandom();
obtenerRazas();
