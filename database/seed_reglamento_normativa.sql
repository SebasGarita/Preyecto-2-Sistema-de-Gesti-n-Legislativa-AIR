ROLLBACK;
BEGIN;

-- 1. Insertar Niveles de Reglamento controlando conflictos por el campo UNIQUE 'nombre'
INSERT INTO catalogo_nivel_reglamento (id_nivel_reglamento, nombre) 
VALUES 
    (1, 'Título'),
    (2, 'Capítulo'),
    (3, 'Artículo'),
    (4, 'Inciso/Párrafo')
ON CONFLICT (nombre) DO UPDATE SET id_nivel_reglamento = EXCLUDED.id_nivel_reglamento;

-- 2. Insertar Estado de Vigencia controlando conflicto por el campo UNIQUE 'nombre'
INSERT INTO catalogo_estado_vigencia (id_estado_vigencia, nombre) 
VALUES (1, 'Vigente')
ON CONFLICT (nombre) DO UPDATE SET id_estado_vigencia = EXCLUDED.id_estado_vigencia;

-- 3. Asegurar que exista el Reglamento Padre con ID 1
INSERT INTO reglamento (id_reglamento, nombre_normativa, sigla) 
VALUES (1, 'Estatuto Orgánico del Instituto Tecnológico de Costa Rica', 'EOITCR')
ON CONFLICT (id_reglamento) DO UPDATE SET nombre_normativa = EXCLUDED.nombre_normativa, sigla = EXCLUDED.sigla;

COMMIT;
BEGIN;

-- Insertar niveles de Títulos, Capítulos, Artículos e Incisos
-- (Ajusta los IDs de catálogos: id_reglamento, id_nivel_reglamento, id_estado_vigencia según tu base de datos)

INSERT INTO elemento_normativo (
    id_elemento, id_reglamento, id_elemento_padre, id_nivel_reglamento, 
    numer_etiqueta, contenido_texto, orden, fecha_inicio_vigencia, id_estado_vigencia
) VALUES

-- ==========================================
-- TITULO I: FINES Y PRINCIPIOS
-- ==========================================
(1, 1, NULL, 1, 'TITULO I', 'FINES Y PRINCIPIOS', 1, '2002-05-01', 1),

(2, 1, 1, 3, 'ARTICULO 1', 'El Instituto Tecnológico de Costa Rica es una institución nacional autónoma de educación superior universitaria, dedicada a la docencia, la investigación y la extensión de la tecnología y ciencias conexas necesarias para el desarrollo de Costa Rica.', 2, '2002-05-01', 1),

(3, 1, 1, 3, 'ARTICULO 2', 'La acción integrada de la docencia, la investigación y la extensión del Instituto, está orientada al cumplimiento de los siguientes fines:', 3, '2002-05-01', 1),
(4, 1, 3, 4, 'a.', 'Formar profesionales en el campo tecnológico que aúnen al dominio de su disciplina una clara conciencia del contexto socioeconómico, cultural y ambiental en que la tecnología se genera, transfiere y aplica, lo cual les permita participar en forma crítica y creativa en las actividades productivas nacionales.', 4, '2002-05-01', 1),
(5, 1, 3, 4, 'b.', 'Generar, adaptar e incorporar, en forma sistemática y continua, la tecnología necesaria para utilizar y transformar provechosamente para el país sus recursos y fuerzas productivas.', 5, '2002-05-01', 1),
(6, 1, 3, 4, 'c.', 'Contribuir al mejoramiento de la calidad de vida del pueblo costarricense mediante la proyección de sus actividades a la atención y solución de los problemas prioritarios del país, a fin de edificar una sociedad más justa.', 6, '2002-05-01', 1),
(7, 1, 3, 4, 'd.', 'Estimular la superación de la comunidad costarricense mediante el patrocinio y el desarrollo de programas culturales.', 7, '2002-05-01', 1),

(8, 1, 1, 3, 'ARTICULO 3', 'Para el cumplimiento de sus fines, el Instituto Tecnológico de Costa Rica se rige por los siguientes principios:', 8, '2002-05-01', 1),
(9, 1, 8, 4, 'a.', 'La búsqueda de la excelencia en el desarrollo de todas sus actividades.', 9, '2002-05-01', 1),
(10, 1, 8, 4, 'b.', 'La vinculación permanente con la realidad costarricense como medio de orientar sus políticas y acciones a las necesidades del país.', 10, '2002-05-01', 1),
(11, 1, 8, 4, 'c.', 'El derecho exclusivo de la comunidad institucional, constituida por profesores, estudiantes y funcionarios administrativos, de darse su propio gobierno y de ejercerlo democráticamente...', 11, '2002-05-01', 1),
(12, 1, 8, 4, 'd.', 'La plena capacidad jurídica del Instituto para adquirir derechos y contraer obligaciones, de conformidad con la Constitución Política y las leyes de Costa Rica.', 12, '2002-05-01', 1),
(13, 1, 8, 4, 'e.', 'La libertad de cátedra, entendida como el derecho de los profesores de proponer los programas académicos y desarrollar los ya establecidos...', 13, '2002-05-01', 1),
(14, 1, 8, 4, 'f.', 'La libertad de expresión de las ideas filosóficas, científicas, políticas y religiosas de los miembros de la Comunidad del Instituto; dentro de un marco de respeto por las personas.', 14, '2002-05-01', 1),
(15, 1, 8, 4, 'g.', 'La igualdad de oportunidades para el ingreso y permanencia de los estudiantes en la Institución.', 15, '2002-05-01', 1),
(16, 1, 8, 4, 'h.', 'La evaluación permanente de los resultados de las labores de la Institución y de cada uno de sus integrantes.', 16, '2002-05-01', 1),
(17, 1, 8, 4, 'i.', 'La responsabilidad de los individuos y órganos del Instituto por las consecuencias de sus acciones y decisiones.', 17, '2002-05-01', 1),

-- ==========================================
-- TITULO II: DOMICILIO
-- ==========================================
(18, 1, NULL, 1, 'TITULO II', 'DOMICILIO', 18, '2002-05-01', 1),

(19, 1, 18, 3, 'ARTICULO 4', 'El Instituto Tecnológico de Costa Rica tiene su domicilio legal y su Sede Central en la Ciudad de Cartago. Además, podrá tener instalaciones y actividades en otros lugares del territorio nacional.', 19, '2002-05-01', 1),

-- ==========================================
-- TITULO III: ESTRUCTURA ORGANIZATIVA
-- ==========================================
(20, 1, NULL, 1, 'TITULO III', 'ESTRUCTURA ORGANIZATIVA', 20, '2002-05-01', 1),

-- CAPITULO I
(21, 1, 20, 2, 'CAPITULO I', 'LA ASAMBLEA INSTITUCIONAL', 21, '2002-05-01', 1),

(22, 1, 21, 3, 'ARTICULO 5', 'La máxima autoridad del Instituto Tecnológico de Costa Rica es la Asamblea Institucional, la cual funciona en dos instancias: la Asamblea Institucional Plebiscitaria y la Asamblea Institucional Representativa.', 22, '2002-05-01', 1),

(23, 1, 21, 3, 'ARTICULO 6', 'La Asamblea Institucional Plebiscitaria está integrada de la siguiente manera:', 23, '2002-05-01', 1),
(24, 1, 23, 4, 'a.', 'Los miembros del Consejo Institucional.', 24, '2002-05-01', 1),
(25, 1, 23, 4, 'b.', 'El Auditor.', 25, '1995-03-11', 1),
(26, 1, 23, 4, 'c.', 'Los Vicerrectores, Directores de Sedes Regionales y Centros Académicos.', 26, '2002-05-01', 1),
(27, 1, 23, 4, 'd.', 'Los miembros titulares del Tribunal Institucional Electoral', 27, '2002-05-01', 1),
(28, 1, 23, 4, 'e.', 'Los Directores de Departamento y los Directores de Centros de Investigación consolidados.', 28, '2002-05-01', 1),
(29, 1, 23, 4, 'f.', 'Todos los profesores del Instituto, nombrados por tiempo indefinido y con una jornada no menor a medio tiempo completo...', 29, '2000-05-03', 1),
(30, 1, 23, 4, 'g.', 'Todos los estudiantes matriculados en algún programa de diplomado, bachillerato, licenciatura, maestría o doctorado...', 30, '2002-05-01', 1),
(31, 1, 23, 4, 'h.', 'Cuando la población estudiantil inscrita en el padrón de la Asamblea Institucional Plebiscitaria represente menos del 25%...', 31, '1996-09-11', 1),
(32, 1, 23, 4, 'i.', 'Todos los funcionarios administrativos del Instituto, nombrados por tiempo indefinido y con una jornada no menor a medio tiempo completo...', 32, '2000-05-03', 1),

(33, 1, 21, 3, 'ARTICULO 7', 'La participación de los sectores estudiantil y administrativo se hará de la siguiente manera:', 33, '2002-05-01', 1),
(34, 1, 33, 4, 'a.', 'Los representantes estudiantiles a que hace referencia el inciso g del Artículo anterior, deberán ser estudiantes regulares del Instituto...', 34, '2002-05-01', 1),
(35, 1, 33, 4, 'b.', 'Para determinar el valor de los votos emitidos por los estudiantes y funcionarios administrativos en la Asamblea Institucional Plebiscitaria...', 35, '1996-09-11', 1),

(36, 1, 21, 3, 'ARTICULO 8', 'Corresponden a la Asamblea Institucional Plebiscitaria las siguientes funciones:', 36, '2002-05-01', 1),
(37, 1, 36, 4, 'a.', 'Elegir a los miembros del Consejo Institucional que le competen.', 37, '2002-05-01', 1),
(38, 1, 36, 4, 'b.', 'Elegir al Rector.', 38, '2002-05-01', 1),
(39, 1, 36, 4, 'c.', 'Revocar, a solicitud de la Asamblea Institucional Representativa o del Consejo Institucional, por causas graves...', 39, '1995-09-20', 1),
(40, 1, 36, 4, 'd.', 'Decidir, mediante votación, sobre la materia que le someta la Asamblea Institucional Representativa o el Consejo Institucional...', 40, '2002-05-01', 1),

(41, 1, 21, 3, 'ARTICULO 9', 'La Asamblea Institucional Representativa está integrada por:', 41, '2002-05-01', 1),
(42, 1, 41, 4, 'a.', 'Los miembros del Consejo Institucional.', 42, '2002-05-01', 1),
(43, 1, 41, 4, 'b.', 'El auditor.', 43, '2002-05-01', 1),
(44, 1, 41, 4, 'c.', 'Los Vicerrectores, directores de Sedes Regionales y Centros Académicos.', 44, '2002-05-01', 1),
(45, 1, 41, 4, 'd.', 'Los miembros titulares del Tribunal Institucional Electoral.', 45, '2002-05-01', 1),
(46, 1, 41, 4, 'e.', 'Los directores de departamento y directores de Centros de Investigación consolidados.', 46, '2002-05-01', 1),
(47, 1, 41, 4, 'f.', 'Un profesor por cada equivalente a cuatro tiempos completos de profesor.', 47, '2002-05-01', 1),
(48, 1, 41, 4, 'g.', 'Una representación estudiantil correspondiente al 25% del total de miembros de la Asamblea Institucional Representativa.', 48, '2002-05-01', 1),
(49, 1, 41, 4, 'h.', 'Una representación de funcionarios administrativos correspondiente al 15% del total de miembros de la Asamblea...', 49, '2002-05-01', 1),
(50, 1, 41, 4, 'i.', 'Cinco egresados del Instituto, quienes no serán considerados como parte del total de la Asamblea...', 50, '2002-05-01', 1),

(51, 1, 21, 3, 'ARTICULO 10', 'Los miembros de la Asamblea Institucional Representativa deberán ser miembros de la Asamblea Institucional Plebiscitaria, excepto los egresados...', 51, '2002-05-01', 1),
(52, 1, 51, 4, 'a.', 'Los representantes de los profesores serán electos por los profesores de cada departamento...', 52, '2002-05-01', 1),
(53, 1, 51, 4, 'b.', 'Los estudiantes serán electos por el mecanismo y para el período que defina el Estatuto de la Federación de Estudiantes...', 53, '2002-05-01', 1),
(54, 1, 51, 4, 'c.', 'Los funcionarios administrativos serán electos mediante el mecanismo que defina el sector...', 54, '1994-09-07', 1),
(55, 1, 51, 4, 'd.', 'Los egresados deberán ser de diferentes carreras y no ser funcionarios ni estudiantes regulares del Instituto...', 55, '2002-05-01', 1),

(56, 1, 21, 3, 'ARTICULO 11', 'Corresponden a la Asamblea Institucional Representativa las siguientes funciones:', 56, '2002-05-01', 1),
(57, 1, 56, 4, 'a.', 'Aprobar, modificar o eliminar, las Políticas Generales del Instituto...', 57, '2001-03-28', 1),
(58, 1, 56, 4, 'b.', 'Velar porque la orientación del Instituto responda a las necesidades del país en los campos de su competencia', 58, '2002-05-01', 1),
(59, 1, 56, 4, 'c.', 'Solicitar al Consejo Institucional las modificaciones al Estatuto Orgánico que considere necesarias...', 59, '2002-05-01', 1),
(60, 1, 56, 4, 'd.', 'Fijar los procedimientos para tramitar las reformas al Estatuto Orgánico referidas a los fines y principios del Instituto...', 60, '1997-09-17', 1),
(61, 1, 56, 4, 'e a l.', 'Ratificar, conocer en apelación, crear sedes, aprobar reglamentos, resolver recomendaciones del Congreso, actuar como Foro...', 61, '2002-05-01', 1),

(62, 1, 21, 3, 'ARTICULO 12', 'La Asamblea Institucional Representativa sesionará ordinariamente entre la quinta y la sétima semana de cada semestre lectivo...', 62, '1994-01-01', 1),

(63, 1, 21, 3, 'ARTICULO 13', 'La Asamblea Institucional Representativa, de su seno elegirá un directorio constituido por tres profesores, dos estudiantes y dos funcionarios...', 63, '1998-03-25', 1),

-- CAPITULO II
(64, 1, 20, 2, 'CAPITULO II', 'EL CONSEJO INSTITUCIONAL', 64, '2002-05-01', 1),

(65, 1, 64, 3, 'ARTICULO 14', 'El Consejo Institucional es el órgano directivo superior del Instituto Tecnológico de Costa Rica y está conformado de la siguiente manera:', 65, '2002-05-01', 1),
(66, 1, 65, 4, 'a.', 'El Rector, quien lo preside', 66, '2002-05-01', 1),
(67, 1, 65, 4, 'b.', 'Dos miembros de la comunidad nacional', 67, '1994-03-23', 1),
(68, 1, 65, 4, 'c.', 'Cuatro profesores del Instituto Tecnológico de Costa Rica', 68, '2002-05-01', 1),
(69, 1, 65, 4, 'd.', 'Un funcionario administrativo del Instituto Tecnológico de Costa Rica', 69, '2002-05-01', 1),
(70, 1, 65, 4, 'e.', 'Dos estudiantes del Instituto Tecnológico de Costa Rica', 70, '2002-05-01', 1),
(71, 1, 65, 4, 'f.', 'Un egresado del Instituto Tecnológico de Costa Rica.', 71, '2002-05-01', 1),

(72, 1, 64, 3, 'ARTICULO 15', 'Los miembros del Consejo Institucional deberán cumplir las siguientes condiciones: a. Ser costarricenses...', 72, '1998-09-30', 1);

COMMIT;