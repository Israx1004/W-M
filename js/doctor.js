// Perfil de cada doctor: doctor.html?id=eva  (los datos vienen de datos/consultorio.json -> "equipo")
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var ICONOS = ["diente-limpio", "diente-estetica", "diente-brackets"];

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

  function poner(clave, valor) {
    document.querySelectorAll('[data-d="' + clave + '"]').forEach(function (n) { n.textContent = valor || ""; });
  }

  // "Dra. Eva Maricela Mendoza" -> { trato: "la Dra. Eva", completo: "la Dra. Eva Maricela Mendoza" }
  function trato(nombre) {
    var partes = nombre.split(" ");
    var titulo = /^dra\.?$/i.test(partes[0]) ? "la" : /^dr\.?$/i.test(partes[0]) ? "el" : "";
    var corto = titulo ? partes.slice(0, 2).join(" ") : partes[0];
    var art = titulo ? titulo + " " : "";
    return { trato: art + corto, completo: art + nombre };
  }

  function noEncontrado() {
    var main = document.getElementById("contenido");
    main.replaceChildren();
    var s = el("section", "marco no-encontrado");
    s.appendChild(el("h1", null, "No encontramos a este doctor."));
    s.appendChild(el("p", null, "Puede que el enlace esté incompleto. Vuelve al inicio para ver a todo el equipo."));
    var a = el("a", "boton boton-principal", "Volver al inicio");
    a.href = "index.html#equipo";
    s.appendChild(a);
    main.appendChild(s);
    document.title = "Doctor no encontrado · W&M Clinica Dental";
  }

  function llenar(d) {
    var id = new URLSearchParams(location.search).get("id");
    var m = d.equipo.find(function (x) { return x.id === id; });
    if (!m) { noEncontrado(); return; }

    var t = trato(m.nombre);
    var c = d.contacto;
    document.title = m.nombre + " · W&M Clinica Dental";

    poner("nombre", m.nombre);
    poner("especialidad", m.especialidad);
    poner("telefono", m.telefono || c.telefono);
    poner("boton_wa", "Agendar con " + t.trato);
    poner("cierre_titulo", "¿Agendamos tu cita con " + t.trato + "?");
    document.querySelectorAll('[data-campo="lema"]').forEach(function (n) { n.textContent = d.lema; });

    // WhatsApp: el número propio del doctor o, si no tiene, el de la clínica
    var numero = m.whatsapp || c.whatsapp;
    var wa = "https://wa.me/" + numero + "?text=" + encodeURIComponent("Hola, quiero agendar una cita con " + t.completo + "en Clinica Dental W&M.");
    document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = wa; a.target = "_blank"; a.rel = "noopener"; });
    document.querySelector(".perfil-numero").setAttribute("aria-label", "WhatsApp de " + m.nombre + ": " + (m.telefono || c.telefono));

    // Cédula (se oculta si está vacía)
    if (m.cedula) {
      poner("cedula", m.cedula);
      document.querySelector("[data-cedula]").hidden = false;
    }

    // Foto principal
    var fig = document.querySelector("[data-d-foto]");
    var img = el("img");
    img.src = m.foto; img.alt = "Retrato de " + m.nombre; img.width = 900; img.height = 1125;
    if (m.foto_posicion) img.style.objectPosition = m.foto_posicion;
    fig.insertBefore(img, fig.firstChild);

    // Especialidades
    var le = document.querySelector('[data-lista="especialidades"]');
    (m.especialidades || []).forEach(function (e, i) {
      var li = el("li", "especialidad aparece");
      li.appendChild(icono(ICONOS[i % ICONOS.length]));
      li.appendChild(el("h3", null, e.titulo));
      if (e.texto) li.appendChild(el("p", null, e.texto));
      le.appendChild(li);
    });
    if (!le.children.length) le.closest("section").hidden = true;

    // Galería: hasta 3 fotos trabajando
    var fotos = (m.galeria || []).slice(0, 3);
    var lg = document.querySelector('[data-lista="galeria"]');
    lg.dataset.n = fotos.length;
    fotos.forEach(function (f) {
      var b = el("button", "galeria-item aparece");
      b.type = "button";
      b.setAttribute("aria-label", "Ver foto completa: " + (f.alt || m.nombre));
      var fi = el("figure");
      var im = el("img");
      im.src = f.foto; im.alt = f.alt || ""; im.loading = "lazy";
      if (f.posicion) im.style.objectPosition = f.posicion;
      fi.appendChild(im);
      fi.appendChild(el("figcaption", null, f.pie || ""));
      b.appendChild(fi);
      b.addEventListener("click", function () { abrirVisor(f.foto, f.alt); });
      lg.appendChild(b);
    });
    if (!fotos.length) document.querySelector("[data-seccion-galeria]").hidden = true;

    // Formación (opcional)
    var lf = document.querySelector('[data-lista="formacion"]');
    (m.formacion || []).forEach(function (f) {
      var li = el("li", "aparece");
      if (f.anio) li.appendChild(el("span", "linea-anio", f.anio));
      li.appendChild(el("h3", null, f.titulo));
      if (f.lugar) li.appendChild(el("p", null, f.lugar));
      lf.appendChild(li);
    });
    if (lf.children.length) document.querySelector("[data-seccion-formacion]").hidden = false;

    // Resto del equipo
    var lo = document.querySelector('[data-lista="otros"]');
    d.equipo.forEach(function (o) {
      if (o === m || !o.id) return;
      var a = el("a", "otro aparece");
      a.href = "doctor.html?id=" + encodeURIComponent(o.id);
      var oi = el("img");
      oi.src = o.foto; oi.alt = ""; oi.loading = "lazy"; oi.width = 88; oi.height = 88;
      if (o.foto_posicion) oi.style.objectPosition = o.foto_posicion;
      a.appendChild(oi);
      var tx = el("div");
      tx.appendChild(el("span", null, o.especialidad));
      tx.appendChild(el("strong", null, o.nombre));
      a.appendChild(tx);
      lo.appendChild(a);
    });
    if (!lo.children.length) document.querySelector("[data-seccion-otros]").hidden = true;
  }

  function abrirVisor(src, alt) {
    var v = document.querySelector("[data-visor]");
    var vi = v.querySelector("img") || v.insertBefore(el("img"), v.firstChild);
    vi.src = src; vi.alt = alt || "";
    if (v.showModal) v.showModal(); else window.open(src, "_blank");
  }
  // Cerrar el visor tocando fuera de la foto
  document.querySelector("[data-visor]").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) e.currentTarget.close();
  });

  function animar() {
    var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll(".perfil, .seccion").forEach(function (s) {
      s.querySelectorAll(".perfil-ruta, h1, .perfil-especialidad, .cedula, .acciones, .perfil-foto, h2, .cabeza p, .cierre > p, .aparece").forEach(function (p, i) {
        p.classList.add("aparece");
        p.style.setProperty("--retraso", Math.min(i, 8) * 80 + "ms");
      });
    });
    inlinarSonrisas();
    observarSonrisas(reducido);
    var objetivos = document.querySelectorAll(".aparece");
    if (reducido || !("IntersectionObserver" in window)) {
      objetivos.forEach(function (o) { o.classList.add("visible"); });
    } else {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      objetivos.forEach(function (o) { io.observe(o); });
    }
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
