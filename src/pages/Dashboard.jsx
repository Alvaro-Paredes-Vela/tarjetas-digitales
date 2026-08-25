import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import PersonaForm from "./PersonaForm";

function iniciales(nombre = "") {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export default function Dashboard() {
  const [empresa, setEmpresa] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nueva, {...} = editar
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setCargando(true);

    const { data: sesion } = await supabase.auth.getUser();
    if (!sesion?.user) {
      navigate("/login");
      return;
    }

    const { data: admin } = await supabase
      .from("usuarios_admin")
      .select("empresa_id, empresas(*)")
      .eq("user_id", sesion.user.id)
      .single();

    if (!admin) {
      setCargando(false);
      return;
    }

    setEmpresa(admin.empresas);

    const { data: listaPersonas } = await supabase
      .from("personas")
      .select("*")
      .eq("empresa_id", admin.empresa_id)
      .order("nombre");

    setPersonas(listaPersonas || []);
    setCargando(false);
  }

  async function eliminar(persona) {
    if (!confirm(`¿Eliminar la tarjeta de ${persona.nombre}?`)) return;
    await supabase.from("personas").delete().eq("id", persona.id);
    cargarTodo();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  async function subirLogo(archivo) {
    if (!archivo) return;
    const ruta = `${empresa.slug}/logo-${Date.now()}.png`;

    const { error: errSubida } = await supabase.storage
      .from("tarjetas")
      .upload(ruta, archivo, { upsert: true });

    if (errSubida) {
      alert("No se pudo subir el logo: " + errSubida.message);
      return;
    }

    const { data } = supabase.storage.from("tarjetas").getPublicUrl(ruta);

    const { error: errUpdate } = await supabase
      .from("empresas")
      .update({ logo_url: data.publicUrl })
      .eq("id", empresa.id);

    if (errUpdate) {
      alert("No se pudo guardar el logo: " + errUpdate.message);
      return;
    }

    cargarTodo();
  }

  if (cargando) return <p className="loading">Cargando...</p>;

  if (!empresa) {
    return (
      <div className="dashboard">
        <p>Tu usuario no está vinculado a ninguna empresa todavía.</p>
        <p>
          Pide al administrador que te agregue en la tabla{" "}
          <code>usuarios_admin</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="empresa-info">
          {empresa.logo_url ? (
            <img
              src={empresa.logo_url}
              alt={empresa.nombre}
              className="empresa-logo"
            />
          ) : (
            <div className="empresa-logo-placeholder">Sin logo</div>
          )}
          <div>
            <h1>{empresa.nombre}</h1>
            <p className="muted">
              tudominio.com/c/{empresa.slug}/&lt;persona&gt;
            </p>
            <label className="btn-ghost logo-upload-btn">
              {empresa.logo_url ? "Cambiar logo" : "Subir logo"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => subirLogo(e.target.files[0])}
              />
            </label>
          </div>
        </div>
        <button className="btn-ghost" onClick={cerrarSesion}>
          Salir
        </button>
      </header>

      <div className="dashboard-toolbar">
        <div>
          <h2 className="dashboard-subtitle">Tarjetas</h2>
          <p className="muted">
            {personas.length}{" "}
            {personas.length === 1 ? "tarjeta creada" : "tarjetas creadas"}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditando({})}>
          + Nueva tarjeta
        </button>
      </div>

      <ul className="persona-list">
        {personas.map((p) => (
          <li key={p.id} className="persona-item">
            <div className="persona-main">
              <div className="persona-avatar">{iniciales(p.nombre)}</div>
              <div>
                <strong>{p.nombre}</strong>
                <span className="muted"> — {p.cargo}</span>
              </div>
            </div>
            <div className="persona-actions">
              <a
                href={`/c/${empresa.slug}/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver tarjeta
              </a>
              <button onClick={() => setEditando(p)}>Editar</button>
              <button className="danger" onClick={() => eliminar(p)}>
                Eliminar
              </button>
            </div>
          </li>
        ))}
        {personas.length === 0 && (
          <p className="muted">Todavía no hay tarjetas creadas.</p>
        )}
      </ul>

      {editando !== null && (
        <PersonaForm
          empresa={empresa}
          persona={editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null);
            cargarTodo();
          }}
        />
      )}
    </div>
  );
}
