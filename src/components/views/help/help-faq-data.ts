export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface FaqCategory {
  category: string
  items: FaqItem[]
}

export const faqCategories: FaqCategory[] = [
  {
    category: 'General',
    items: [
      {
        id: 'general-1',
        question: '¿Qué es Minka?',
        answer:
          'Minka es una plataforma boliviana de crowdfunding (financiación colectiva) que permite recaudar fondos para causas personales, comunitarias, sociales y solidarias. Conectamos a personas que necesitan apoyo económico con personas dispuestas a colaborar, ofreciendo una experiencia segura, transparente y accesible desde cualquier parte del mundo.',
      },
      {
        id: 'general-2',
        question: '¿Cómo funciona Minka?',
        answer:
          'Crear una campaña en Minka es sencillo:\n\n1. Crea una cuenta y verifica tu identidad.\n2. Diseña tu campaña explicando tu causa y estableciendo una meta de recaudación.\n3. Publica y comparte tu campaña con tu comunidad.\n4. Recibe donaciones y mantén informados a tus donantes sobre los avances alcanzados.\n5. Solicita el desembolso de los fondos recaudados cuando los necesites.',
      },
      {
        id: 'general-3',
        question: '¿Por qué nació Minka?',
        answer:
          'Minka nació para facilitar la solidaridad y el apoyo mutuo en Bolivia. Queremos que cualquier persona, familia, organización o comunidad tenga una herramienta confiable para movilizar apoyo económico cuando más lo necesita.',
      },
      {
        id: 'general-4',
        question: '¿Dónde está disponible Minka?',
        answer:
          'Minka es una plataforma digital accesible desde cualquier parte del mundo. Las personas pueden realizar donaciones desde Bolivia o desde el extranjero. Actualmente, los fondos recaudados pueden transferirse únicamente a cuentas bancarias bolivianas registradas y verificadas en la plataforma.',
      },
      {
        id: 'general-5',
        question: '¿Por qué confiar en Minka?',
        answer:
          'Minka implementa mecanismos de autenticación de usuarios, verificación de campañas, monitoreo permanente y sistemas seguros de pago. Además, promovemos la transparencia mediante procesos de revisión documental y actualizaciones periódicas de las campañas, permitiendo que los donantes tomen decisiones informadas.',
      },
    ],
  },
  {
    category: 'Contacto',
    items: [
      {
        id: 'contact-1',
        question: '¿Cómo puedo contactar a Minka?',
        answer:
          'Puedes comunicarte con Minka mediante los canales oficiales que aparecen al final de esta página: correo electrónico, Facebook, Instagram y LinkedIn.',
      },
    ],
  },
  {
    category: 'Crear una campaña',
    items: [
      {
        id: 'campaign-1',
        question: '¿Quién puede crear una campaña?',
        answer:
          'Cualquier persona mayor de edad, organización o institución que cumpla con los requisitos establecidos por la plataforma.',
      },
      {
        id: 'campaign-2',
        question: '¿Qué tipo de campañas puedo crear?',
        answer:
          'Puedes crear campañas para cubrir necesidades personales, apoyar a otras personas o contribuir al trabajo de organizaciones e iniciativas comunitarias. Actualmente, Minka permite campañas en las siguientes categorías:\n\n- Salud\n- Educación\n- Deporte\n- Medio Ambiente\n- Bienestar Animal\n- Cultura\n- Igualdad\n- Otras causas sociales o personales',
      },
      {
        id: 'campaign-3',
        question: '¿Cómo crear una campaña?',
        answer:
          'Solo necesitas crear una cuenta y seguir los pasos indicados en la plataforma:\n\n1. Registrarte y verificar tu identidad.\n2. Crear tu campaña.\n3. Solicitar la verificación de tu campaña (opcional).\n4. Compartir tu campaña con familiares, amigos y redes de apoyo.\n5. Gestionar tu campaña y realizar actualizaciones desde tu cuenta.\n\nSi necesitas ayuda, nuestro equipo puede brindarte orientación durante el proceso de creación y promoción de tu campaña.',
      },
      {
        id: 'campaign-4',
        question:
          '¿Puedo crear una campaña para otra persona?',
        answer:
          'Sí. Puedes crear una campaña para apoyar a un familiar, amigo en necesidad o institución. Si se trata de una institución, recomendamos que esté aprobada por Minka para generar mayor confianza. En todos los casos, debes contar con su consentimiento o con documentación que respalde tu relación con la persona beneficiaria. Esto contribuye a generar mayor transparencia y confianza para quienes realizan donaciones.',
      },
      {
        id: 'campaign-5',
        question: '¿Qué son las instituciones aprobadas por Minka?',
        answer:
          'Son empresas, asociaciones, instituciones, fundaciones u otras entidades legalmente reconocidas que pueden registrarse en la base de datos de Minka para generar mayor confianza sobre el destino de los aportes. Esto es especialmente importante para donantes internacionales, que suelen necesitar más señales de seguridad antes de apoyar una campaña.\n\nTe recomendamos hacerlo porque mejora la visibilidad, la creación de campañas y la confianza de los donantes.\n\nPara solicitarlo, envíanos un mensaje a info@minka-comunidad.org con: datos legales, número de registro, forma legal, NIT, cuenta bancaria, ubicación, información de contacto, sitio web, redes sociales y cualquier otro dato que quieran compartir con nosotros.\n\nEstos datos no son públicos; se usan únicamente para nuestra administración y para poder responder con mayor seguridad cuando un donante tenga dudas.',
      },
      {
        id: 'campaign-6',
        question: '¿Qué es la verificación de campañas?',
        answer:
          'La verificación es un proceso mediante el cual el equipo de Minka revisa la documentación presentada por el organizador de una campaña para validar que la información proporcionada sea consistente con la causa publicada.\n\nDocumentos que se pueden presentar dependen del tipo de causa, pueden ser diagnóstico médico, receta farmacéutica, invitación a un torneo, factura de gastos realizados, presupuestos, etc.\n\nLas campañas verificadas cuentan con un distintivo visible dentro de la plataforma que ayuda a generar mayor confianza entre los donantes.',
      },
      {
        id: 'campaign-7',
        question: '¿La verificación es obligatoria?',
        answer:
          'No. La verificación es completamente voluntaria.\n\nSin embargo, las campañas verificadas suelen generar mayor confianza y pueden aumentar sus posibilidades de éxito.',
      },
      {
        id: 'campaign-8',
        question:
          '¿Qué documentos se solicitan para verificar una campaña?',
        answer:
          'Los requisitos dependen del tipo de campaña.\n\nPor ejemplo:\n- Campañas médicas: informes médicos, diagnósticos, recetas o presupuestos.\n- Campañas educativas: certificados de inscripción o documentación académica.\n- Campañas institucionales: documentación legal de la organización.\n\nAdemás, se solicitarán documentos generales de identificación de la persona organizadora.',
      },
      {
        id: 'campaign-9',
        question: '¿Cuánto cuesta crear una campaña?',
        answer:
          'Crear una campaña en Minka es completamente gratuito.\n\nPara cubrir los costos operativos y tecnológicos de la plataforma, se aplica una comisión únicamente sobre los fondos efectivamente recaudados:\n\n- Donaciones nacionales: 5% del monto donado.\n- Donaciones internacionales: 11% del monto donado más USD 0,30 por transacción.\n\nAdicionalmente, las personas donantes pueden realizar una contribución voluntaria (tip) destinada al mantenimiento y desarrollo de la plataforma. Esta contribución es opcional y puede ajustarse libremente al momento de donar.',
      },
      {
        id: 'campaign-10',
        question:
          '¿Cómo aumentar las probabilidades de éxito de mi campaña?',
        answer:
          'Las campañas más exitosas suelen:\n\n- Explicar claramente la necesidad o causa.\n- Utilizar fotografías y videos auténticos. Dispones de 5 espacios para fotos y 1 espacio para un video de YouTube; aprovéchalos, porque las imágenes ayudan a contar mejor tu historia.\n- Establecer metas de recaudación realistas en tiempo y monto.\n- **Compartirse ampliamente en redes sociales y aplicaciones de mensajería.**\n- Mantener informados a los donantes mediante actualizaciones periódicas.\n- Solicitar la verificación de la campaña.\n\nLa transparencia y la comunicación constante son factores clave para generar confianza y apoyo.\n\nNosotros ponemos la plataforma: una herramienta para generar confianza, un puente para recibir donaciones del exterior y un espacio centralizado para nuestras necesidades. Te damos visibilidad y seguridad, pero el éxito de una campaña también depende en gran medida de que puedas compartir y viralizar tu causa en tu círculo.',
      },
      {
        id: 'campaign-11',
        question:
          '¿Qué pasa si no alcanzo mi meta de recaudación?',
        answer:
          'Minka utiliza un modelo de recaudación flexible. Esto significa que recibirás los fondos efectivamente recaudados al finalizar la campaña, incluso si no alcanzas la meta establecida, descontando las comisiones correspondientes.',
      },
      {
        id: 'campaign-12',
        question: '¿Cómo recibo el dinero recaudado?',
        answer:
          'Los desembolsos pueden solicitarse a través de la plataforma.\n\nAntes de cada transferencia, el equipo de Minka realizará una revisión básica para garantizar el cumplimiento de las políticas de la plataforma. Los fondos serán transferidos a la cuenta bancaria registrada y verificada por el organizador de la campaña.\n\nPara solicitar un desembolso anticipado, el monto mínimo acumulado deberá ser de Bs 100.',
      },
    ],
  },
  {
    category: 'Donaciones',
    items: [
      {
        id: 'donations-1',
        question: '¿Quién puede donar?',
        answer:
          'Cualquier persona dentro o fuera de Bolivia puede realizar una donación utilizando los métodos de pago habilitados por la plataforma.',
      },
      {
        id: 'donations-2',
        question: '¿Puedo donar desde el extranjero?',
        answer:
          'Sí. Las personas que se encuentren fuera de Bolivia pueden donar utilizando tarjetas de crédito o débito habilitadas para pagos internacionales.',
      },
      {
        id: 'donations-3',
        question: '¿Puedo donar de forma anónima?',
        answer:
          'Sí. Puedes realizar una donación sin crear una cuenta o iniciar sesión, manteniendo tu identidad oculta para el organizador de la campaña y otros usuarios.',
      },
      {
        id: 'donations-4',
        question: '¿Cómo sé que mi donación fue recibida?',
        answer:
          'Para donaciones internacionales, la pasarela de pago enviará una confirmación una vez que la transacción haya sido procesada exitosamente.\n\nPara donaciones nacionales mediante QR, la plataforma mostrará una confirmación una vez que el pago haya sido registrado correctamente.',
      },
      {
        id: 'donations-5',
        question: '¿Puedo solicitar un reembolso?',
        answer:
          'Las donaciones realizadas a través de Minka no son reembolsables.',
      },
    ],
  },
  {
    category: 'Pagos y comisiones',
    items: [
      {
        id: 'payments-1',
        question: '¿Qué métodos de pago acepta Minka?',
        answer:
          'Actualmente puedes realizar donaciones mediante:\n\n- Tarjetas de crédito.\n- Tarjetas de débito.\n- Transferencias mediante QR para entidades financieras habilitadas en Bolivia.',
      },
      {
        id: 'payments-2',
        question:
          '¿Existe un monto mínimo o máximo para donar?',
        answer:
          'Los límites pueden variar según el método de pago utilizado y las condiciones establecidas por los proveedores de servicios de pago. Los montos aplicables serán informados al momento de realizar la donación.',
      },
      {
        id: 'payments-3',
        question:
          '¿Puedo retirar fondos antes de que finalice mi campaña?',
        answer:
          'En situaciones excepcionales y debidamente justificadas, el equipo de Minka podrá evaluar solicitudes de desembolso anticipado.',
      },
    ],
  },
  {
    category: 'Seguridad y transparencia',
    items: [
      {
        id: 'security-1',
        question:
          '¿Por qué Minka verifica algunas campañas?',
        answer:
          'La verificación ayuda a aumentar la transparencia y la confianza de los donantes, permitiéndoles contar con información adicional sobre la causa que desean apoyar.',
      },
      {
        id: 'security-2',
        question:
          '¿Cómo ayuda Minka a validar las campañas?',
        answer:
          'Minka utiliza procesos de autenticación de usuarios, revisión documental, verificación de campañas y monitoreo permanente de la actividad dentro de la plataforma.\n\nAunque realizamos esfuerzos razonables para revisar la información proporcionada, no podemos garantizar la veracidad absoluta de toda la documentación presentada por terceros.',
      },
      {
        id: 'security-3',
        question:
          '¿Cómo protege Minka mis datos personales y financieros?',
        answer:
          'Implementamos medidas de seguridad técnicas y organizativas para proteger la información personal y financiera de nuestros usuarios. La información sensible utilizada para procesos de verificación es tratada de forma confidencial y conforme a nuestras políticas de privacidad.',
      },
      {
        id: 'security-4',
        question:
          '¿Cómo se administra el dinero recaudado?',
        answer:
          'Los fondos son gestionados mediante sistemas de pago seguros y permanecen bajo administración de la plataforma hasta que corresponda realizar su transferencia al beneficiario registrado.',
      },
      {
        id: 'security-5',
        question:
          '¿Qué hago si detecto una campaña fraudulenta?',
        answer:
          'Si identificas información falsa, sospechosa o engañosa en una campaña, puedes reportarla a través de nuestros canales oficiales de soporte. Todas las denuncias serán revisadas por nuestro equipo de manera confidencial.',
      },
    ],
  },
]
