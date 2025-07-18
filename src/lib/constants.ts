export interface Department {
  name: string;
  code: string;
  color: string;
  image: string;
}

export const DEPARTMENTS: Department[] = [
  {
    name: 'Ministerio Infantil y del Adolescente',
    code: 'ministerio-infantil-adolescente',
    color: '#FFD700',
    image: '/departments/ministerio-infantil-adolescente.png',
  },
  {
    name: 'Ministerio Juvenil',
    code: 'ministerio-juvenil',
    color: '#FF6B35',
    image: '/departments/ministerio-juvenil.png',
  },
  {
    name: 'Escuela Sabática',
    code: 'escuela-sabatica',
    color: '#87CEEB',
    image: '/departments/escuela-sabatica.png',
  },
  {
    name: 'Ministerio de la Mujer',
    code: 'ministerio-mujer',
    color: '#9370DB',
    image: '/departments/ministerio-mujer.png',
  },
  {
    name: 'Ministerio de la Familia',
    code: 'ministerio-familia',
    color: '#32CD32',
    image: '/departments/ministerio-familia.png',
  },
  {
    name: 'Ministerios Personales y Evangelismo',
    code: 'ministerios-personales-evangelismo',
    color: '#DC143C',
    image: '/departments/ministerios-personales-evangelismo.png',
  },
  {
    name: 'Mayordomía Cristiana',
    code: 'mayordomia-cristiana',
    color: '#8B4513',
    image: '/departments/mayordomia-cristiana.png',
  },
  {
    name: 'Ministerio de Salud y Temperancia',
    code: 'ministerio-salud-temperancia',
    color: '#228B22',
    image: '/departments/ministerio-salud-temperancia.png',
  },
  {
    name: 'Comunicación',
    code: 'comunicacion',
    color: '#4169E1',
    image: '/departments/comunicacion.png',
  },
  {
    name: 'Educación',
    code: 'educacion',
    color: '#FFD700',
    image: '/departments/educacion.png',
  },
  {
    name: 'Libertad Religiosa',
    code: 'libertad-religiosa',
    color: '#FFFFFF',
    image: '/departments/libertad-religiosa.png',
  },
  {
    name: 'Ministerio de Publicaciones',
    code: 'ministerio-publicaciones',
    color: '#654321',
    image: '/departments/ministerio-publicaciones.png',
  },
  {
    name: 'Ministerio de la Música',
    code: 'ministerio-musica',
    color: '#6B3AA0',
    image: '/departments/ministerio-musica.png',
  },
  {
    name: 'Servicios a la Comunidad',
    code: 'servicios-comunidad',
    color: '#FF8C00',
    image: '/departments/servicios-comunidad.png',
  },
  {
    name: 'Club de Conquistadores',
    code: 'club-conquistadores',
    color: '#FFD700',
    image: '/departments/club-conquistadores.png',
  },
  {
    name: 'Club de Aventureros',
    code: 'club-aventureros',
    color: '#FF0000',
    image: '/departments/club-aventureros.png',
  },
];

export const getDepartmentByCode = (code: string): Department | undefined => {
  return DEPARTMENTS.find((dept) => dept.code === code);
};

export const getDepartmentName = (code: string): string => {
  const dept = getDepartmentByCode(code);
  return dept ? dept.name : 'Sin departamento';
};

export const getDepartmentColor = (code: string): string => {
  const dept = getDepartmentByCode(code);
  return dept ? dept.color : '#6B7280'; // Default gray color
};

export const getDepartmentImage = (code: string): string => {
  const dept = getDepartmentByCode(code);
  return dept ? dept.image : '';
};
