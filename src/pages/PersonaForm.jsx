import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../lib/supabaseClient";
import { buildVCard, descargarVCard } from "../lib/vcard";

// Tamaño real del canvas (calidad de impresión); se muestra más chico con CSS.
const QR_RESOLUTION = 800;

function descargarCanvas(canvasRef, nombreArchivo) {
  const canvas = canvasRef.current?.querySelector("canvas");
  if (!canvas) return;
  const url = canvas.toDataURL("image/png", 1.0);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PersonaForm({ empresa, persona, onClose, onSaved }) {
  const esNueva = !persona.id;
  const [form, setForm] = useState({
    nombre: persona.nombre || "",
    cargo: persona.cargo || "",
    celular: persona.celular || "",
    correo: persona.correo || "",
    whatsapp: persona.whatsapp || "",
    foto_url: persona.foto_url || "",
  });
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const qrOfflineRef = useRef(null);
  const qrOnlineRef = useRef(null);

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function subirFoto() {
    if (!archivoFoto) return form.foto_url;

    const nombreArchivo = `${empresa.slug}/${slugify(form.nombre)}-${Date.now()}.jpg`;
    const { error: errSubida } = await supabase.storage
      .from("tarjetas")
      .upload(nombreArchivo, archivoFoto, { upsert: true });

    if (errSubida) {
      throw new Error("No se pudo subir la foto: " + errSubida.message);
    }

    const { data } = supabase.storage
      .from("tarjetas")
      .getPublicUrl(nombreArchivo);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.nombre.trim() ||
      !form.cargo.trim() ||
      !form.celular.trim() ||
      !form.correo.trim()
    ) {
      setError("Completa nombre, cargo, celular y correo.");
      return;
    }

    setGuardando(true);
    try {
      const fotoUrl = await subirFoto();
      const payload = {
        empresa_id: empresa.id,
        slug: slugify(form.nombre),
        nombre: form.nombre.trim(),
        cargo: form.cargo.trim(),
        celular: form.celular.trim(),
        correo: form.correo.trim(),
        whatsapp: form.whatsapp.trim(),
        foto_url: fotoUrl,
      };

      if (esNueva) {
        const { error: errInsert } = await supabase
          .from("personas")
          .insert(payload);
        if (errInsert) throw errInsert;
      } else {
        const { error: errUpdate } = await supabase
          .from("personas")
          .update(payload)
          .eq("id", persona.id);
        if (errUpdate) throw errUpdate;
      }

      onSaved();
    } catch (err) {
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const vcardPreview =
    form.nombre && form.celular ? buildVCard(form, empresa.nombre) : null;

  const slugPreview = form.nombre ? slugify(form.nombre) : "";
  const urlTarjeta = slugPreview
    ? `${window.location.origin}/c/${empresa.slug}/${slugPreview}`
    : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{esNueva ? "Nueva tarjeta" : "Editar tarjeta"}</h2>

        <form onSubmit={handleSubmit}>
          <label>Nombre completo</label>
          <input
            value={form.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
            required
          />

          <label>Cargo</label>
          <input
            value={form.cargo}
            onChange={(e) => actualizar("cargo", e.target.value)}
            required
          />

          <label>Celular</label>
          <input
            value={form.celular}
            onChange={(e) => actualizar("celular", e.target.value)}
            required
          />

          <label>Correo</label>
          <input
            type="email"
            value={form.correo}
            onChange={(e) => actualizar("correo", e.target.value)}
            required
          />

          <label>WhatsApp (solo números con código de país)</label>
          <input
            value={form.whatsapp}
            onChange={(e) => actualizar("whatsapp", e.target.value)}
          />

          <label>Foto</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setArchivoFoto(e.target.files[0])}
          />

          {error && <p className="auth-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar tarjeta"}
            </button>
          </div>
        </form>

        {vcardPreview && (
          <div className="qr-preview-grid">
            <div className="qr-preview-item">
              <p className="muted">
                <strong>QR sin internet</strong>
                <br />
                Guarda el contacto directo con los datos incluidos, sin abrir
                ninguna página.
              </p>
              <div ref={qrOfflineRef} className="qr-canvas-wrap">
                <QRCodeCanvas
                  value={vcardPreview}
                  size={QR_RESOLUTION}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#22281f"
                />
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  descargarCanvas(
                    qrOfflineRef,
                    `qr-sin-internet-${slugPreview}.png`,
                  )
                }
              >
                Descargar QR (PNG, alta calidad)
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => descargarVCard(form, empresa.nombre)}
              >
                Descargar .vcf de prueba
              </button>
            </div>

            <div className="qr-preview-item">
              <p className="muted">
                <strong>QR con internet</strong>
                <br />
                Abre la tarjeta en el navegador; desde ahí se toca "Agregar a
                contacto".
              </p>
              {urlTarjeta ? (
                <>
                  <div ref={qrOnlineRef} className="qr-canvas-wrap">
                    <QRCodeCanvas
                      value={urlTarjeta}
                      size={QR_RESOLUTION}
                      level="H"
                      includeMargin
                      bgColor="#ffffff"
                      fgColor="#22281f"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() =>
                      descargarCanvas(
                        qrOnlineRef,
                        `qr-con-internet-${slugPreview}.png`,
                      )
                    }
                  >
                    Descargar QR (PNG, alta calidad)
                  </button>
                  {esNueva && (
                    <p className="qr-note">
                      Guarda la tarjeta primero para que este enlace funcione.
                    </p>
                  )}
                </>
              ) : (
                <p className="muted">
                  Escribe el nombre para generar el enlace.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
