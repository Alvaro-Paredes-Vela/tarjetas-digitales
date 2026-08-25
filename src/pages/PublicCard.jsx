import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { descargarVCard } from "../lib/vcard";

export default function PublicCard() {
  const { empresaSlug, personaSlug } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [persona, setPersona] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    cargar();
  }, [empresaSlug, personaSlug]);

  async function cargar() {
    setCargando(true);

    const { data: emp } = await supabase
      .from("empresas")
      .select("*")
      .eq("slug", empresaSlug)
      .single();

    if (!emp) {
      setNoEncontrado(true);
      setCargando(false);
      return;
    }

    const { data: per } = await supabase
      .from("personas")
      .select("*")
      .eq("empresa_id", emp.id)
      .eq("slug", personaSlug)
      .eq("activo", true)
      .single();

    if (!per) {
      setNoEncontrado(true);
      setCargando(false);
      return;
    }

    setEmpresa(emp);
    setPersona(per);
    setCargando(false);
  }

  if (cargando) return <p className="loading">Cargando tarjeta...</p>;
  if (noEncontrado)
    return <p className="loading">Esta tarjeta no existe o fue desactivada.</p>;

  return (
    <div
      className="public-card-page"
      style={{
        "--color-primario": empresa.color_primario,
        "--color-acento": empresa.color_acento,
      }}
    >
      <div className="card">
        <div className={`banner${empresa.logo_url ? " has-logo" : ""}`}>
          {empresa.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nombre} className="logo" />
          ) : (
            <p className="org-name">{empresa.nombre}</p>
          )}
        </div>

        <div className="photo-wrap">
          <div
            className="photo"
            style={{
              backgroundImage: persona.foto_url
                ? `url(${persona.foto_url})`
                : "none",
            }}
          />
        </div>

        <div className="cbody">
          <p className="name">{persona.nombre}</p>
          <p className="role">{persona.cargo}</p>
          <p className="company">{empresa.nombre}</p>

          <hr className="divider" />

          {persona.correo && (
            <a className="field" href={`mailto:${persona.correo}`}>
              <span className="icon">✉</span>
              <span className="field-text">
                <small>Correo</small>
                {persona.correo}
              </span>
            </a>
          )}
          {persona.whatsapp && (
            <a
              className="field"
              href={`https://wa.me/${persona.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="icon wa">☏</span>
              <span className="field-text">
                <small>WhatsApp</small>Agrégame en WhatsApp
              </span>
            </a>
          )}
          {persona.celular && (
            <a className="field" href={`tel:${persona.celular}`}>
              <span className="icon gold">📞</span>
              <span className="field-text">
                <small>Móvil</small>
                {persona.celular}
              </span>
            </a>
          )}

          <button
            className="save-btn"
            onClick={() => descargarVCard(persona, empresa.nombre)}
          >
            Agregar a contacto
          </button>
        </div>
      </div>
    </div>
  );
}
