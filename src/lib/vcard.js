export function buildVCard(persona, empresaNombre) {
  const partes = persona.nombre.trim().split(' ');
  const apellido = partes.length > 1 ? partes.slice(-2).join(' ') : '';
  const nombreP = partes.length > 1 ? partes.slice(0, -2).join(' ') : persona.nombre;

  const lineas = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${apellido};${nombreP};;;`,
    `FN:${persona.nombre}`,
    `ORG:${empresaNombre || ''}`,
    `TITLE:${persona.cargo || ''}`,
  ];

  if (persona.celular) lineas.push(`TEL;TYPE=CELL,VOICE:${persona.celular}`);
  if (persona.correo) lineas.push(`EMAIL;TYPE=INTERNET:${persona.correo}`);

  lineas.push('END:VCARD');
  return lineas.join('\r\n');
}

export function descargarVCard(persona, empresaNombre) {
  const vcard = buildVCard(persona, empresaNombre);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = persona.nombre.replace(/\s+/g, '_') + '.vcf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
