(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var ICONOS = { limpio: "diente-limpio", estetica: "diente-estetica", brackets: "diente-brackets" };
  var ICONOS_PASOS = ["diente-limpio", "diente", "diente-estetica"];

  function campo(datos, ruta) {
    return ruta.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, datos);
  }

  function el(etiqueta, clase, texto) {
    var n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  // Copia el dibujo del <symbol> dentro del <svg> (en vez de <use>) para que el CSS pueda animar sus piezas
  function icono(id, clase) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", ((clase || "") + " icono-vivo icono-" + id).trim());
    svg.setAttribute("aria-hidden", "true");
    var sym = document.getElementById(id);
    if (!sym) return svg;
    svg.setAttribute("viewBox", sym.getAttribute("viewBox"));
    var g = document.createElementNS(ns, "g");
    g.setAttribute("class", "icono-cuerpo");
    Array.prototype.forEach.call(sym.childNodes, function (n) { g.appendChild(n.cloneNode(true)); });
    svg.appendChild(g);
    return svg;
  }

  // Separadores "sonrisa": mismo truco, para animar curva, dientes y brackets por separado
  function inlinarSonrisas() {
    var sym = document.getElementById("sonrisa");
    if (!sym) return;
    document.querySelectorAll(".sonrisa svg use").forEach(function (u) {
      var svg = u.parentNode;
      Array.prototype.forEach.call(sym.childNodes, function (n) { svg.appendChild(n.cloneNode(true)); });
      svg.removeChild(u);
    });
  }

  // Las sonrisas se animan cada vez que entran en pantalla (al bajar y al subir)
  function observarSonrisas(reducido) {
    var sonrisas = document.querySelectorAll(".sonrisa");
    if (reducido || !("IntersectionObserver" in window)) {
      sonrisas.forEach(function (o) { o.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { e.target.classList.toggle("visible", e.isIntersecting); });
    }, { rootMargin: "-6% 0px -6% 0px" });
    sonrisas.forEach(function (o) { io.observe(o); });
  }

  function llenar(d) {
    // Textos simples
    document.querySelectorAll("[data-campo]").forEach(function (n) {
      var v = campo(d, n.getAttribute("data-campo"));
      if (v != null) n.textContent = v;
    });

    // Fotos
    var fp = document.querySelector('[data-foto="portada"]');
    if (fp) { fp.src = d.portada.foto; fp.alt = d.portada.foto_alt; }
    var fr = document.querySelector('[data-foto="proceso"]');
    if (fr) { fr.src = d.proceso.foto; fr.alt = d.proceso.foto_alt; }

    // Enlaces de contacto
    var c = d.contacto;
    var wa = "https://wa.me/" + c.whatsapp + "?text=" + encodeURIComponent(c.whatsapp_mensaje);
    document.querySelectorAll("[data-whatsapp]").forEach(function (a) { a.href = wa; a.target = "_blank"; a.rel = "noopener"; });
    document.querySelectorAll("[data-tel]").forEach(function (a) { a.href = "tel:" + c.telefono_link; });
    document.querySelectorAll("[data-correo]").forEach(function (a) { a.href = "mailto:" + c.correo; });
    var q = encodeURIComponent(c.mapa_busqueda);
    var mapa = document.querySelector("[data-mapa]");
    if (mapa) mapa.src = "https://www.google.com/maps?q=" + q + "&output=embed";
    var ml = document.querySelector("[data-mapa-link]");
    if (ml) ml.href = "https://www.google.com/maps/search/?api=1&query=" + q;

    // Servicios
    var ls = document.querySelector('[data-lista="servicios"]');
    ls.replaceChildren();
    d.servicios.forEach(function (s) {
      var art = el("article", "servicio aparece");
      art.appendChild(icono(ICONOS[s.icono] || "diente", "servicio-icono"));
      art.appendChild(el("h3", null, s.titulo));
      art.appendChild(el("p", null, s.texto));
      var ul = el("ul");
      s.incluye.forEach(function (i) { ul.appendChild(el("li", null, i)); });
      art.appendChild(ul);
      ls.appendChild(art);
    });

    // Botón único de servicios (WhatsApp con su propio mensaje)
    var bs = document.querySelector("[data-whatsapp-servicios]");
    if (bs) {
      bs.href = "https://wa.me/" + c.whatsapp + "?text=" + encodeURIComponent(d.servicios_mensaje || c.whatsapp_mensaje);
      bs.target = "_blank"; bs.rel = "noopener";
    }

    // Pasos
    var lp = document.querySelector('[data-lista="pasos"]');
    lp.replaceChildren();
    d.proceso.pasos.forEach(function (p, i) {
      var li = el("li", "paso aparece");
      li.appendChild(icono(ICONOS_PASOS[i % ICONOS_PASOS.length], ""));
      var t = el("div");
      t.appendChild(el("h3", null, p.titulo));
      t.appendChild(el("p", null, p.texto));
      li.appendChild(t);
      lp.appendChild(li);
    });

    // Equipo
    var le = document.querySelector('[data-lista="equipo"]');
    le.replaceChildren();
    d.equipo.forEach(function (m) {
      var art = el("article", "doctor aparece");
      var fig = el("div", "doctor-foto");
      var img = el("img");
      img.src = m.foto; img.alt = "Foto ilustrativa de " + m.nombre; img.loading = "lazy";
      img.width = 900; img.height = 1125;
      if (m.foto_posicion) img.style.objectPosition = m.foto_posicion;
      fig.appendChild(img);
      art.appendChild(fig);
      art.appendChild(el("p", null, m.especialidad));
      // Si el doctor tiene "id" en datos/consultorio.json, el nombre lleva a su perfil (doctor.html?id=...)
      var h3 = el("h3");
      if (m.id) {
        var cv = el("a", "doctor-cv", m.nombre);
        cv.href = "doctor.html?id=" + encodeURIComponent(m.id);
        cv.title = "Ver perfil de " + m.nombre;
        h3.appendChild(cv);
      } else {
        h3.textContent = m.nombre;
      }
      art.appendChild(h3);
      le.appendChild(art);
    });

    // Horario
    var lh = document.querySelector('[data-lista="horario"]');
    lh.replaceChildren();
    d.horario.forEach(function (h, i) {
      if (i) lh.appendChild(el("br"));
      lh.appendChild(document.createTextNode(h.dias + " · " + h.abre + " a " + h.cierra));
    });

    estadoAbierto(d.horario);
  }

  // abierto/cerrado
  function estadoAbierto(horario) {
    var n = document.querySelector("[data-estado]");
    if (!n) return;
    var partes = new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var dias = { dom: 0, lun: 1, mar: 2, mié: 3, mie: 3, jue: 4, vie: 5, sáb: 6, sab: 6 };
    var dia = dias[(partes.find(function (p) { return p.type === "weekday"; }).value || "").replace(".", "").toLowerCase()];
    var hh = partes.find(function (p) { return p.type === "hour"; }).value;
    var mm = partes.find(function (p) { return p.type === "minute"; }).value;
    var ahora = (hh === "24" ? "00" : hh) + ":" + mm;

    var hoy = horario.find(function (h) { return h.numeros_dia.indexOf(dia) >= 0; });
    if (hoy && ahora >= hoy.abre && ahora < hoy.cierra) {
      n.textContent = "Abierto ahora · hoy atendemos hasta las " + hoy.cierra;
      n.className = "estado abierto";
      return;
    }
    // Prpxima apertura
    for (var k = 0; k < 7; k++) {
      var dd = (dia + k) % 7;
      var h = horario.find(function (x) { return x.numeros_dia.indexOf(dd) >= 0; });
      if (!h || (k === 0 && ahora >= h.abre)) continue;
      var nombres = ["el domingo", "el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado"];
      var cuando = k === 0 ? "hoy" : k === 1 ? "mañana" : nombres[dd];
      n.textContent = "Cerrado ahora · abrimos " + cuando + " a las " + h.abre;
      n.className = "estado cerrado";
      return;
    }
  }

  function animar() {
    var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Cada sección: título, texto, luego sus piezas, escalonados.
    document.querySelectorAll(".seccion, .portada").forEach(function (s) {
      var piezas = s.querySelectorAll("h1, h2, .cabeza p, .portada-copia, .acciones, .proceso-texto > p, .datos, .portada-foto, .proceso-foto, .mapa, .aparece");
      piezas.forEach(function (p, i) {
        p.classList.add("aparece");
        p.style.setProperty("--retraso", Math.min(i, 8) * 80 + "ms");
      });
    });
    inlinarSonrisas();
    observarSonrisas(reducido);
    var objetivos = document.querySelectorAll(".aparece");
    if (reducido || !("IntersectionObserver" in window)) {
      objetivos.forEach(function (o) { o.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    objetivos.forEach(function (o) { io.observe(o); });

    var barra = document.querySelector(".barra");
    window.addEventListener("scroll", function () { barra.classList.toggle("con-scroll", window.scrollY > 8); }, { passive: true });
  }

  var anio = document.querySelector("[data-anio]");
  if (anio) anio.textContent = "© " + new Date().getFullYear() + " W&M Consultorio Dental";

  fetch("datos/consultorio.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { llenar(d); animar(); })
    .catch(function (e) { console.error("Error al cargar datos:", e); });
})();
