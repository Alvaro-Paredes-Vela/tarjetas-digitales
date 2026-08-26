import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { descargarVCard } from "../lib/vcard";

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm2.1.2L12 12.5l7.9-6.3H4.1zM20 8.1l-7.4 5.9a1 1 0 0 1-1.2 0L4 8.1V18h16V8.1z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.4 21 3 13.6 3 4.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2c-5.514 0-9.997 4.483-9.997 9.997 0 1.763.462 3.486 1.34 5.003L2 22l5.126-1.318a9.958 9.958 0 0 0 4.878 1.24h.004c5.514 0 9.997-4.483 9.997-9.997C21.999 6.483 17.518 2 12.004 2zm0 18.153h-.003a8.146 8.146 0 0 1-4.146-1.135l-.297-.176-3.045.783.813-2.968-.193-.305a8.126 8.126 0 0 1-1.253-4.355c0-4.494 3.657-8.15 8.157-8.15 2.178 0 4.225.849 5.765 2.39a8.1 8.1 0 0 1 2.386 5.766c-.002 4.494-3.659 8.15-8.184 8.15z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C7.802 2 4 5.403 4 9.6 4 15 12 22 12 22s8-7 8-12.4C20 5.403 16.198 2 12 2zm0 10.2a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z" />
    </svg>
  );
}

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
              <span className="icon">
                <MailIcon />
              </span>
              <span className="field-text">
                <small>Correo</small>
                {persona.correo}
              </span>
            </a>
          )}

          {empresa.ubicacion_url && (
            <a
              className="field"
              href={empresa.ubicacion_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="icon location">
                <PinIcon />
              </span>
              <span className="field-text">
                <small>Ubicación</small>
                {empresa.ubicacion_texto || "Ver ubicación en el mapa"}
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
              <span className="icon wa">
                <WhatsAppIcon />
              </span>
              <span className="field-text">
                <small>WhatsApp</small>WhatsApp
              </span>
            </a>
          )}

          {persona.celular && (
            <a className="field" href={`tel:${persona.celular}`}>
              <span className="icon gold">
                <PhoneIcon />
              </span>
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
