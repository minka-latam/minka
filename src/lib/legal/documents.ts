export type LegalBlockType = "title" | "updated" | "chapter" | "section" | "paragraph" | "listItem";

export interface LegalBlock {
  type: LegalBlockType;
  text: string;
}

export interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  updated: string;
  blocks: readonly LegalBlock[];
}

export const legalDocuments = [
  {
    "id": "terms",
    "slug": "terminos-y-condiciones",
    "title": "TÉRMINOS Y CONDICIONES DE USO DE LA PLATAFORMA MINKA",
    "updated": "Última actualización: julio de 2026",
    "blocks": [
      {
        "type": "title",
        "text": "TÉRMINOS Y CONDICIONES DE USO DE LA PLATAFORMA MINKA"
      },
      {
        "type": "updated",
        "text": "Última actualización: julio de 2026"
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 1. INTRODUCCIÓN"
      },
      {
        "type": "paragraph",
        "text": "Bienvenido a Minka, una plataforma tecnológica de crowdfunding basada exclusivamente en Donaciones voluntarias, diseñada para facilitar la recaudación de fondos destinados a causas, proyectos e iniciativas de carácter lícito, promoviendo la solidaridad, la colaboración y el apoyo entre personas, organizaciones y comunidades."
      },
      {
        "type": "paragraph",
        "text": "La Plataforma Minka es operada por Herbas Orias y Compañía Ltda., sociedad legalmente constituida conforme a las leyes del Estado Plurinacional de Bolivia (en adelante, “Minka”)."
      },
      {
        "type": "paragraph",
        "text": "Los presentes Términos y Condiciones de Uso (en adelante, los “Términos”) regulan el acceso, navegación, registro y utilización de la Plataforma, así como de cualquier aplicación móvil, herramienta, funcionalidad, servicio o canal digital que Minka ponga a disposición de las Personas Usuarias."
      },
      {
        "type": "paragraph",
        "text": "Al acceder, navegar, registrarse o utilizar la Plataforma, la Persona Usuaria declara haber leído, comprendido y aceptado íntegramente los presentes Términos, así como las Políticas de Minka que resulten aplicables y se incorporen por referencia. Si no está de acuerdo con cualquiera de sus disposiciones, deberá abstenerse de utilizar la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Los presentes Términos son aplicables a todas las personas naturales y jurídicas que accedan o utilicen la Plataforma, incluyendo a las Personas Organizadoras, Personas Donantes, Beneficiarios y visitantes, en la medida que corresponda según la forma en que interactúen con Minka."
      },
      {
        "type": "paragraph",
        "text": "Minka constituye una plataforma tecnológica que facilita la creación de Campañas de recaudación de fondos y la realización de Donaciones voluntarias. Salvo disposición expresa en contrario, Minka no actúa como Beneficiario de las Donaciones, representante o mandatario de las Personas Usuarias, entidad financiera, entidad de intermediación financiera, fiduciaria ni representante de las Personas Organizadoras o de los Beneficiarios de las Campañas."
      },
      {
        "type": "paragraph",
        "text": "La utilización de la Plataforma se regirá por la normativa vigente del Estado Plurinacional de Bolivia y por las disposiciones contenidas en los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 2. DEFINICIONES E INTERPRETACIÓN"
      },
      {
        "type": "paragraph",
        "text": "Para efectos de los presentes Términos, las palabras y expresiones que se indican a continuación tendrán el significado que se les atribuye en el presente Capítulo, independientemente de que sean utilizadas en singular o plural."
      },
      {
        "type": "section",
        "text": "2.1. Plataforma"
      },
      {
        "type": "paragraph",
        "text": "Ecosistema digital operado por Minka, integrado por el sitio web, aplicaciones, herramientas, funcionalidades y demás medios tecnológicos mediante los cuales Minka presta sus servicios."
      },
      {
        "type": "section",
        "text": "2.2. Persona Usuaria"
      },
      {
        "type": "paragraph",
        "text": "Toda persona natural o jurídica que acceda, navegue, se registre o utilice la Plataforma o cualquiera de los servicios ofrecidos por Minka, independientemente de la modalidad de uso o del rol que desempeñe dentro de la Plataforma."
      },
      {
        "type": "section",
        "text": "2.3. Persona Organizadora"
      },
      {
        "type": "paragraph",
        "text": "Persona Usuaria que crea y administra una Campaña a través de la Plataforma."
      },
      {
        "type": "section",
        "text": "2.4. Beneficiario"
      },
      {
        "type": "paragraph",
        "text": "Persona natural, persona jurídica, organización o comunidad en cuyo beneficio se crea una Campaña y a cuya finalidad se destinan total o parcialmente los Fondos Recaudados. El Beneficiario podrá coincidir o no con la Persona Organizadora."
      },
      {
        "type": "section",
        "text": "2.5. Persona Donante"
      },
      {
        "type": "paragraph",
        "text": "Persona Usuaria que realiza voluntariamente una Donación a favor de una Campaña publicada en la Plataforma."
      },
      {
        "type": "section",
        "text": "2.6. Donación"
      },
      {
        "type": "paragraph",
        "text": "Aporte económico voluntario, libre y, por regla general, no reembolsable, realizado por una Persona Donante a favor de una Campaña publicada en la Plataforma y canalizado mediante los servicios tecnológicos ofrecidos por Minka."
      },
      {
        "type": "paragraph",
        "text": "La Donación no constituye una inversión, préstamo, compraventa o aporte societario ni genera derecho a contraprestación alguna por parte de Minka, de la Persona Organizadora o del Beneficiario."
      },
      {
        "type": "section",
        "text": "2.7. Campaña"
      },
      {
        "type": "paragraph",
        "text": "Solicitud pública de recaudación de fondos creada y administrada por una Persona Organizadora a través de la Plataforma, integrada por la información, imágenes, actualizaciones y demás contenidos asociados a una causa, proyecto, necesidad o iniciativa de carácter lícito."
      },
      {
        "type": "section",
        "text": "2.8. Fondos Recaudados"
      },
      {
        "type": "paragraph",
        "text": "Monto bruto histórico correspondiente al total de las Donaciones recibidas por una Campaña y reflejado en la Plataforma, sin perjuicio de los desembolsos previamente realizados, las comisiones de Minka, los costos de procesamiento de pagos, impuestos, retenciones legales u otros cargos aplicables."
      },
      {
        "type": "section",
        "text": "2.9. Fondos Disponibles para Desembolso"
      },
      {
        "type": "paragraph",
        "text": "Monto de los Fondos Recaudados de una Campaña que, al momento de una solicitud de desembolso, se encuentra disponible para ser transferido, sin incluir los montos previamente desembolsados y sujeto a la verificación de su disponibilidad efectiva, así como a la deducción de las comisiones y demás cargos aplicables."
      },
      {
        "type": "section",
        "text": "2.10. Procesador de Pagos"
      },
      {
        "type": "paragraph",
        "text": "Persona jurídica o proveedor de servicios independiente que facilita el procesamiento de pagos, transferencias u otras operaciones utilizadas por la Plataforma para canalizar las Donaciones."
      },
      {
        "type": "paragraph",
        "text": "Los Procesadores de Pagos actúan conforme a sus propias condiciones y son responsables de los servicios que prestan."
      },
      {
        "type": "section",
        "text": "2.11. Verificación de Campañas"
      },
      {
        "type": "paragraph",
        "text": "Servicio ofrecido por Minka mediante el cual, a solicitud de la Persona Organizadora y de conformidad con la Política de Verificación de Campañas de Minka, se realiza la revisión de la información y documentación presentada para respaldar una Campaña, con el propósito de brindar mayores elementos de confianza a las Personas Usuarias y reducir los riesgos de fraude o uso indebido de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La Verificación de Campañas acredita únicamente que Minka realizó una revisión de la información y documentación presentada conforme a la Política de Verificación de Campañas de Minka. No constituye una auditoría, certificación, garantía o respaldo sobre la autenticidad absoluta de la información proporcionada, la conducta futura de la Persona Organizadora o del Beneficiario, el cumplimiento de la finalidad de la Campaña ni el destino final de los Fondos Recaudados."
      },
      {
        "type": "section",
        "text": "2.12. Políticas de Minka"
      },
      {
        "type": "paragraph",
        "text": "Documentos o reglas complementarias emitidas por Minka y puestas a disposición a través de la Plataforma, incluyendo, entre otras, la Política de Privacidad de Minka, la Política de Verificación de Campañas de Minka y la Política de Desembolsos de Minka, en la medida que resulten aplicables."
      },
      {
        "type": "section",
        "text": "2.13. Términos"
      },
      {
        "type": "paragraph",
        "text": "El presente documento denominado “Términos y Condiciones de Uso de la Plataforma Minka”, incluyendo sus futuras modificaciones y las Políticas de Minka que expresamente se incorporen por referencia."
      },
      {
        "type": "section",
        "text": "2.14. Interpretación"
      },
      {
        "type": "paragraph",
        "text": "Los títulos de los Capítulos y artículos tienen fines de organización y no afectarán la interpretación de los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Salvo que del contexto se desprenda lo contrario:"
      },
      {
        "type": "listItem",
        "text": "a) las referencias en singular incluyen el plural y viceversa;"
      },
      {
        "type": "listItem",
        "text": "b) las referencias a personas comprenden a personas naturales y jurídicas, cuando resulte aplicable;"
      },
      {
        "type": "listItem",
        "text": "c) toda referencia a una disposición legal comprenderá sus modificaciones, reglamentaciones o normas que la sustituyan;"
      },
      {
        "type": "listItem",
        "text": "d) las referencias a un Capítulo, artículo o numeral se entenderán realizadas a los presentes Términos, salvo que expresamente se indique lo contrario; y"
      },
      {
        "type": "listItem",
        "text": "e) los términos definidos en el presente Capítulo mantendrán el significado aquí establecido cuando sean utilizados con mayúscula inicial en los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Las referencias a Legitimación de Ganancias Ilícitas y Financiamiento del Terrorismo se entenderán conforme a las definiciones y alcances previstos en la normativa penal y de prevención vigente en el Estado Plurinacional de Bolivia."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 3. OBJETO, NATURALEZA Y FUNCIONAMIENTO DE LA PLATAFORMA"
      },
      {
        "type": "section",
        "text": "3.1. Objeto de la Plataforma"
      },
      {
        "type": "paragraph",
        "text": "Minka es una plataforma tecnológica que opera bajo la modalidad de crowdfunding por Donación, entendido como el mecanismo mediante el cual múltiples personas realizan aportes económicos voluntarios para apoyar causas, proyectos, necesidades o iniciativas de carácter lícito a través de una plataforma digital."
      },
      {
        "type": "paragraph",
        "text": "El objeto de Minka es facilitar la creación, publicación, difusión y administración de Campañas de recaudación de fondos, así como permitir que las Personas Donantes realicen Donaciones voluntarias a favor de dichas Campañas mediante los medios de pago habilitados en la Plataforma."
      },
      {
        "type": "section",
        "text": "3.2. Naturaleza del servicio"
      },
      {
        "type": "paragraph",
        "text": "La Plataforma facilita la interacción entre Personas Organizadoras, Personas Donantes y Beneficiarios, poniendo a disposición herramientas tecnológicas que permiten la creación, publicación, administración y difusión de Campañas, la realización de Donaciones y la gestión de solicitudes de desembolso, de conformidad con los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "Minka presta un servicio tecnológico de crowdfunding por Donación y, salvo disposición expresa en contrario, no actúa como representante, mandataria, fiduciaria, administradora de patrimonios, entidad financiera o entidad de intermediación financiera de las Personas Usuarias."
      },
      {
        "type": "paragraph",
        "text": "Minka no crea ni organiza las Campañas publicadas en la Plataforma y no determina su finalidad, contenido o forma de ejecución. Estas decisiones corresponden a la Persona Organizadora, de conformidad con los presentes Términos."
      },
      {
        "type": "section",
        "text": "3.3. Servicios ofrecidos"
      },
      {
        "type": "paragraph",
        "text": "A través de la Plataforma, Minka ofrece, entre otros, los siguientes servicios:"
      },
      {
        "type": "listItem",
        "text": "a) registro y administración de cuentas de Personas Usuarias;"
      },
      {
        "type": "listItem",
        "text": "b) creación, publicación, edición, actualización y finalización de Campañas;"
      },
      {
        "type": "listItem",
        "text": "c) facilitación de la recepción y registro de las Donaciones efectuadas mediante los medios de pago habilitados en la Plataforma;"
      },
      {
        "type": "listItem",
        "text": "d) recepción y gestión de solicitudes de Verificación de Campañas, de conformidad con la Política de Verificación de Campañas de Minka;"
      },
      {
        "type": "listItem",
        "text": "e) gestión de solicitudes de desembolso de los Fondos Disponibles para Desembolso, de conformidad con la Política de Desembolsos de Minka;"
      },
      {
        "type": "listItem",
        "text": "f) publicación de actualizaciones relacionadas con las Campañas;"
      },
      {
        "type": "listItem",
        "text": "g) servicios de soporte a las Personas Usuarias; y"
      },
      {
        "type": "listItem",
        "text": "h) otros servicios o funcionalidades que Minka incorpore en el futuro, de conformidad con los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "section",
        "text": "3.4. Funcionamiento de la Plataforma"
      },
      {
        "type": "paragraph",
        "text": "Las Campañas creadas por las Personas Organizadoras serán publicadas en la Plataforma una vez completado el proceso de creación correspondiente y de conformidad con las funcionalidades disponibles."
      },
      {
        "type": "paragraph",
        "text": "La publicación de una Campaña no implica que esta haya sido objeto de Verificación de Campañas ni que Minka haya revisado, validado o certificado la información publicada por la Persona Organizadora."
      },
      {
        "type": "paragraph",
        "text": "La Verificación de Campañas constituye un servicio independiente que podrá ser solicitado por la Persona Organizadora de conformidad con la Política de Verificación de Campañas de Minka."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Organizadoras podrán editar, actualizar y finalizar sus Campañas, así como solicitar el desembolso de los Fondos Disponibles para Desembolso, de conformidad con las funcionalidades disponibles en la Plataforma, los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Donantes podrán realizar Donaciones a las Campañas publicadas mediante los medios de pago habilitados en la Plataforma, de conformidad con los presentes Términos."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 4. REGISTRO Y CUENTAS DE PERSONAS USUARIAS"
      },
      {
        "type": "section",
        "text": "4.1. Registro de Personas Usuarias"
      },
      {
        "type": "paragraph",
        "text": "El registro en la Plataforma es gratuito y podrá realizarse por cualquier persona natural o jurídica que acepte los presentes Términos y proporcione la información requerida para la creación de una cuenta."
      },
      {
        "type": "paragraph",
        "text": "La creación de una cuenta será obligatoria para crear y administrar Campañas y acceder a aquellas funcionalidades que así lo requieran."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Donantes podrán realizar Donaciones sin registrarse en la Plataforma. En estos casos, la Donación podrá mostrarse públicamente como anónima, de conformidad con las funcionalidades disponibles, sin perjuicio del tratamiento de la información asociada a la operación conforme a la Política de Privacidad de Minka."
      },
      {
        "type": "paragraph",
        "text": "Las personas jurídicas podrán registrarse mediante una cuenta institucional y deberán designar una persona de contacto autorizada para actuar en su representación frente a Minka."
      },
      {
        "type": "paragraph",
        "text": "Para crear y administrar Campañas, la Persona Usuaria deberá tener al menos dieciocho (18) años de edad o actuar en representación de una persona jurídica y encontrarse debidamente facultada para ello."
      },
      {
        "type": "section",
        "text": "4.2. Información de la cuenta"
      },
      {
        "type": "paragraph",
        "text": "La Persona Usuaria deberá proporcionar información completa, veraz, exacta y actualizada durante el proceso de registro y mantener dicha información actualizada mientras utilice la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La Persona Usuaria es responsable de la información proporcionada a través de su cuenta y de comunicar o actualizar cualquier cambio relevante conforme a las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá solicitar información o documentación adicional cuando resulte razonablemente necesario para verificar la información proporcionada, identificar a la Persona Usuaria, gestionar riesgos de fraude o actividades ilícitas, prevenir el uso indebido de la Plataforma, prestar sus servicios, cumplir obligaciones legales o aplicar los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "section",
        "text": "4.3. Seguridad y acceso"
      },
      {
        "type": "paragraph",
        "text": "La cuenta es personal e intransferible. La Persona Usuaria es responsable de mantener la confidencialidad de sus credenciales de acceso y de las actividades realizadas a través de su cuenta."
      },
      {
        "type": "paragraph",
        "text": "La Persona Usuaria deberá informar a Minka, a la mayor brevedad posible, sobre cualquier acceso no autorizado, uso indebido o incidente de seguridad relacionado con su cuenta del que tenga conocimiento."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá habilitar mecanismos adicionales de autenticación o servicios de acceso proporcionados por terceros, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La utilización de servicios de autenticación proporcionados por terceros podrá encontrarse sujeta a las condiciones aplicables del proveedor correspondiente."
      },
      {
        "type": "section",
        "text": "4.4. Administración de la cuenta"
      },
      {
        "type": "paragraph",
        "text": "Cada Persona Usuaria podrá mantener una única cuenta personal en la Plataforma, sin perjuicio de que pueda crear y administrar una o varias Campañas desde dicha cuenta."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Usuarias podrán actualizar la información de su cuenta conforme a las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La verificación de la identidad de una Persona Usuaria, cuando corresponda, constituye un procedimiento distinto del registro de la cuenta y podrá realizarse en los casos previstos en los presentes Términos o en las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "La creación de una cuenta no implica que la identidad de la Persona Usuaria haya sido previamente verificada por Minka."
      },
      {
        "type": "section",
        "text": "4.5. Cierre de la cuenta"
      },
      {
        "type": "paragraph",
        "text": "La Persona Usuaria podrá solicitar el cierre de su cuenta en cualquier momento, de conformidad con las funcionalidades o canales habilitados por Minka."
      },
      {
        "type": "paragraph",
        "text": "No obstante, Minka podrá diferir el cierre de la cuenta cuando existan Campañas activas, solicitudes de desembolso pendientes, procesos de Verificación de Campañas o supervisión en curso, requerimientos de autoridad competente u otras circunstancias que hagan necesaria la conservación temporal de la cuenta o de determinada información para el cumplimiento de obligaciones legales o contractuales."
      },
      {
        "type": "paragraph",
        "text": "El cierre de la cuenta no afectará la validez de las Donaciones realizadas, las Campañas creadas, los desembolsos efectuados, las obligaciones pendientes ni cualquier otra relación jurídica originada con anterioridad al cierre de la cuenta."
      },
      {
        "type": "paragraph",
        "text": "La información asociada a una cuenta cerrada podrá ser conservada por Minka cuando resulte necesario de conformidad con la normativa aplicable y la Política de Privacidad de Minka."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 5. CAMPAÑAS"
      },
      {
        "type": "section",
        "text": "5.1. Principios aplicables a las Campañas"
      },
      {
        "type": "paragraph",
        "text": "Las Campañas constituyen el principal mecanismo mediante el cual las Personas Organizadoras pueden crear y administrar iniciativas destinadas a promover causas, proyectos, necesidades o actividades de carácter lícito y solicitar el apoyo voluntario de otras personas a través de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Las Campañas deberán crearse y administrarse de buena fe y contener información clara, veraz y suficiente que permita a las Personas Donantes comprender razonablemente la finalidad de la recaudación y adoptar una decisión informada."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora es responsable de la información y demás contenido publicado en su Campaña, así como de su administración, de conformidad con los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "section",
        "text": "5.2. Creación y publicación de Campañas"
      },
      {
        "type": "paragraph",
        "text": "La creación de una Campaña podrá iniciarse mediante la elaboración de un borrador, el cual permanecerá disponible únicamente para la Persona Organizadora hasta que decida publicarlo."
      },
      {
        "type": "paragraph",
        "text": "Para publicar una Campaña, la Persona Organizadora deberá proporcionar la información requerida por la Plataforma, de conformidad con las funcionalidades disponibles al momento de su creación."
      },
      {
        "type": "paragraph",
        "text": "Una vez publicada, la Campaña será visible a través de la Plataforma y podrá recibir Donaciones de conformidad con los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "La publicación de una Campaña es independiente del procedimiento de Verificación de Campañas y no implica que Minka haya revisado, validado o certificado la información proporcionada por la Persona Organizadora."
      },
      {
        "type": "section",
        "text": "5.3. Modificación y actualización de la Campaña"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá modificar y actualizar la información y demás contenido de su Campaña de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Asimismo, podrá publicar actualizaciones relacionadas con el desarrollo de la Campaña o con el uso de los Fondos Recaudados cuando ello resulte pertinente para mantener informadas a las Personas Donantes."
      },
      {
        "type": "paragraph",
        "text": "Determinados elementos de la Campaña podrán dejar de ser editables una vez publicada cuando ello resulte necesario para preservar la transparencia, integridad o adecuado funcionamiento de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora deberá mantener razonablemente actualizada la información de su Campaña durante su vigencia cuando se produzcan hechos relevantes que puedan afectar significativamente la comprensión de su finalidad o desarrollo."
      },
      {
        "type": "section",
        "text": "5.4. Finalidad de la Campaña"
      },
      {
        "type": "paragraph",
        "text": "Toda Campaña deberá identificar de manera clara la finalidad para la cual se solicitan las Donaciones, de modo que la información publicada permita a las Personas Donantes comprender razonablemente el propósito de la recaudación y adoptar una decisión informada."
      },
      {
        "type": "paragraph",
        "text": "La finalidad informada en la Campaña forma parte de la información que las Personas Donantes consideran al momento de decidir si desean realizar una Donación."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora será responsable del uso de los Fondos Recaudados y deberá actuar de buena fe y de manera coherente con la finalidad informada en la Campaña."
      },
      {
        "type": "paragraph",
        "text": "Minka no garantiza el cumplimiento de la finalidad de la Campaña ni el destino final de los Fondos Recaudados, sin perjuicio de sus facultades de Verificación de Campañas y supervisión previstas en los presentes Términos."
      },
      {
        "type": "section",
        "text": "5.5. Beneficiarios de la Campaña"
      },
      {
        "type": "paragraph",
        "text": "Las Campañas podrán ser creadas en beneficio de la propia Persona Organizadora, de otra persona natural, de una persona jurídica, organización o comunidad, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Cuando una Campaña sea creada en beneficio de un tercero, la Persona Organizadora será responsable de la información y demás contenido publicado, así como de la creación y administración de la Campaña."
      },
      {
        "type": "paragraph",
        "text": "La designación de un Beneficiario no modifica la relación jurídica existente entre Minka y la Persona Organizadora, quien continuará siendo responsable frente a Minka por el cumplimiento de los presentes Términos y de las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "La designación del Beneficiario se realiza bajo la responsabilidad de la Persona Organizadora, sin perjuicio de las facultades de Verificación de Campañas y supervisión de Minka previstas en los presentes Términos."
      },
      {
        "type": "section",
        "text": "5.6. Verificación de Campañas"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá solicitar la Verificación de su Campaña de conformidad con las funcionalidades disponibles en la Plataforma y con la Política de Verificación de Campañas de Minka."
      },
      {
        "type": "paragraph",
        "text": "La Verificación de Campañas constituye un servicio independiente de la publicación de la Campaña y tiene por finalidad brindar mayores elementos de confianza a las Personas Donantes y a la comunidad de la Plataforma mediante la revisión de la información y documentación presentada por la Persona Organizadora."
      },
      {
        "type": "paragraph",
        "text": "La Verificación de una Campaña no constituye una auditoría, certificación o garantía sobre la autenticidad absoluta de la información proporcionada ni implica que Minka garantice el cumplimiento de la finalidad de la Campaña, el destino de los Fondos Recaudados o la conducta futura de la Persona Organizadora o del Beneficiario."
      },
      {
        "type": "paragraph",
        "text": "La Verificación de una Campaña no modifica la responsabilidad de la Persona Organizadora respecto de la información publicada, la administración de la Campaña ni el cumplimiento de los presentes Términos y de las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "La información y documentación proporcionada directamente a Minka para fines de Verificación de Campañas será tratada de conformidad con la Política de Privacidad de Minka y la Política de Verificación de Campañas de Minka."
      },
      {
        "type": "section",
        "text": "5.7. Vigencia y finalización de la Campaña"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora establecerá, al momento de crear la Campaña, un plazo estimado para la recaudación de Donaciones, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá solicitar el desembolso de los Fondos Disponibles para Desembolso durante la vigencia de la Campaña, de conformidad con los presentes Términos y la Política de Desembolsos de Minka."
      },
      {
        "type": "paragraph",
        "text": "La finalización de la Campaña no impedirá que la Persona Organizadora solicite el desembolso de los Fondos Disponibles para Desembolso existentes al momento de la finalización, de conformidad con la Política de Desembolsos de Minka."
      },
      {
        "type": "paragraph",
        "text": "Cuando la Campaña no hubiera alcanzado la meta económica inicialmente prevista, la Persona Organizadora podrá optar por darla por finalizada o mantenerla vigente para continuar recibiendo Donaciones, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Las solicitudes de desembolso no implican, por sí mismas, la finalización de la Campaña. Cuando la Campaña permanezca vigente después de un desembolso, podrá continuar recibiendo Donaciones de conformidad con los presentes Términos y la Política de Desembolsos de Minka."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá dar por finalizada la Campaña en cualquier momento mediante las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá suspender o dar por finalizada una Campaña en los casos previstos en los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "La finalización de una Campaña no extingue las obligaciones previamente asumidas por la Persona Organizadora ni afecta los procedimientos de Verificación de Campañas, supervisión, desembolso u otras actuaciones que deban continuar conforme a los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 6. DONACIONES"
      },
      {
        "type": "section",
        "text": "6.1. Naturaleza de las Donaciones"
      },
      {
        "type": "paragraph",
        "text": "Las Donaciones realizadas a través de la Plataforma constituyen aportes económicos voluntarios efectuados por las Personas Donantes con la finalidad de apoyar una Campaña publicada en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Las Donaciones no otorgan a la Persona Donante derecho a recibir bienes, servicios, beneficios, rendimientos, participaciones o contraprestaciones de cualquier naturaleza a cambio de su aporte."
      },
      {
        "type": "paragraph",
        "text": "Las Donaciones podrán realizarse mediante los medios de pago habilitados por Minka en cada momento, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Una Donación se considerará realizada cuando el medio de pago utilizado confirme exitosamente la operación y Minka registre la Donación en la Campaña correspondiente."
      },
      {
        "type": "paragraph",
        "text": "La realización de una Donación implica la aceptación de los presentes Términos y de las Políticas de Minka que resulten aplicables, aun cuando la Persona Donante no cuente con una cuenta registrada en la Plataforma."
      },
      {
        "type": "section",
        "text": "6.2. Proceso de Donación"
      },
      {
        "type": "paragraph",
        "text": "Las Personas Donantes podrán realizar una o más Donaciones a una o varias Campañas publicadas en la Plataforma utilizando cualquiera de los medios de pago habilitados por Minka."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Donantes determinarán libremente el monto de cada Donación. Minka no establece un monto mínimo o máximo general para realizar Donaciones, sin perjuicio de las limitaciones técnicas, operativas o transaccionales que pudieran resultar aplicables al medio de pago utilizado o al Procesador de Pagos correspondiente."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá revisar las Donaciones y los patrones de operación asociados a estas cuando existan circunstancias inusuales, inconsistencias o indicios razonables de fraude, uso indebido de la Plataforma, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo u otras actividades ilícitas. En estos casos, Minka podrá solicitar información o documentación adicional y adoptar las medidas previstas en los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Antes de confirmar una Donación, la Persona Donante deberá verificar la información de la Campaña, el monto de la Donación y el medio de pago seleccionado."
      },
      {
        "type": "paragraph",
        "text": "La Persona Donante es responsable de utilizar un medio de pago que se encuentre autorizada a utilizar y de proporcionar correctamente la información requerida para procesar la operación."
      },
      {
        "type": "paragraph",
        "text": "Una Donación podrá no completarse cuando existan circunstancias técnicas, problemas de conectividad, fallas o rechazos relacionados con el medio de pago, el Procesador de Pagos o la entidad financiera interviniente, o cualquier otra circunstancia que impida procesar correctamente la operación."
      },
      {
        "type": "paragraph",
        "text": "Cuando una operación no sea confirmada exitosamente por el medio de pago y registrada por Minka, no será considerada una Donación realizada a través de la Plataforma."
      },
      {
        "type": "section",
        "text": "6.3. Confirmación y registro de la Donación"
      },
      {
        "type": "paragraph",
        "text": "Una vez realizada una Donación, Minka pondrá a disposición de la Persona Donante una confirmación de la operación, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Cuando la Persona Donante cuente con una cuenta registrada en la Plataforma, las Donaciones realizadas quedarán registradas en su historial de Donaciones y Minka podrá remitir la confirmación correspondiente al correo electrónico asociado a su cuenta."
      },
      {
        "type": "paragraph",
        "text": "Cuando la Persona Donante no cuente con una cuenta registrada en la Plataforma, la confirmación de la operación se mostrará a través de las funcionalidades disponibles durante el proceso de Donación."
      },
      {
        "type": "paragraph",
        "text": "La confirmación o el registro de una Donación tiene carácter informativo y no constituye una factura, recibo fiscal ni certificación sobre la Campaña, la Persona Organizadora, el Beneficiario, el cumplimiento de la finalidad de la Campaña o el destino de los Fondos Recaudados."
      },
      {
        "type": "section",
        "text": "6.4. Carácter definitivo de las Donaciones"
      },
      {
        "type": "paragraph",
        "text": "Las Donaciones realizadas a través de la Plataforma tienen carácter definitivo y, por regla general, no son reembolsables."
      },
      {
        "type": "paragraph",
        "text": "La Persona Donante no podrá solicitar la devolución de una Donación por cambio de opinión, por no haberse alcanzado la meta económica de la Campaña, por la finalización de esta o por no encontrarse conforme posteriormente con el desarrollo o resultado de la Campaña."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá revisar situaciones excepcionales relacionadas con cobros duplicados, incidencias técnicas, operaciones revertidas o desconocidas a través del medio de pago utilizado, requerimientos de autoridad competente u otras circunstancias que deban ser atendidas de conformidad con la normativa aplicable o las Políticas de Minka."
      },
      {
        "type": "paragraph",
        "text": "La revisión de una situación excepcional no implica la obligación de Minka de efectuar un reembolso y estará sujeta a las circunstancias de cada caso, así como a las condiciones y procedimientos aplicables al medio de pago, al Procesador de Pagos y a las demás entidades que intervengan en la operación."
      },
      {
        "type": "paragraph",
        "text": "Cuando corresponda realizar una reversión o devolución de fondos de conformidad con la normativa aplicable, una disposición de autoridad competente o las condiciones de las entidades intervinientes, Minka podrá adoptar las medidas necesarias para ajustar el registro de la Donación y el monto reflejado en la Campaña."
      },
      {
        "type": "section",
        "text": "6.5. Donaciones anónimas"
      },
      {
        "type": "paragraph",
        "text": "Las personas podrán realizar Donaciones sin contar con una cuenta registrada en la Plataforma. En estos casos, la Donación podrá mostrarse públicamente como anónima, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "El carácter anónimo de una Donación se refiere únicamente a la forma en que esta se muestra públicamente en la Plataforma. Minka conserva el registro de la Donación y la información asociada a la operación, de conformidad con la Política de Privacidad de Minka y la normativa aplicable. No implica que la operación se realice de manera anónima frente a los Procesadores de Pagos, las entidades financieras que intervengan en la operación o las autoridades competentes."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá acceder, recibir y conservar la información asociada a la operación que sea proporcionada o generada a través de los medios de pago, los Procesadores de Pagos o las entidades financieras intervinientes, de conformidad con la normativa aplicable y la Política de Privacidad de Minka."
      },
      {
        "type": "paragraph",
        "text": "La realización de una Donación sin una cuenta registrada implica igualmente la aceptación de los presentes Términos y de las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "section",
        "text": "6.6. Moneda de las operaciones"
      },
      {
        "type": "paragraph",
        "text": "Las Donaciones podrán realizarse en bolivianos (BOB) o en dólares estadounidenses (USD), según los medios de pago habilitados en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Las Donaciones realizadas en dólares estadounidenses serán convertidas a bolivianos al tipo de cambio aplicado por el Procesador de Pagos o la entidad interviniente al momento de procesar la operación, previa deducción de las comisiones y cargos aplicados por dichos servicios."
      },
      {
        "type": "paragraph",
        "text": "Las comisiones de Minka, los Fondos Disponibles para Desembolso y los desembolsos se calcularán y procesarán en bolivianos."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 7. DESEMBOLSOS"
      },
      {
        "type": "section",
        "text": "7.1. Solicitud de desembolso"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá solicitar el desembolso de los Fondos Disponibles para Desembolso de su Campaña, de conformidad con las funcionalidades disponibles en la Plataforma y con la Política de Desembolsos de Minka."
      },
      {
        "type": "paragraph",
        "text": "Al solicitar el desembolso, la Persona Organizadora deberá proporcionar la información bancaria requerida por la Plataforma y será responsable de verificar que los datos consignados sean correctos, completos y correspondan a una cuenta habilitada para recibir la transferencia."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá designar una cuenta bancaria propia, del Beneficiario o de un tercero para recibir el desembolso. La designación de una cuenta bancaria distinta a la de la Persona Organizadora se realizará bajo su responsabilidad y no modificará las obligaciones asumidas por esta frente a Minka."
      },
      {
        "type": "paragraph",
        "text": "Cuando la cuenta bancaria designada pertenezca a una persona distinta de la Persona Organizadora o del Beneficiario, Minka podrá solicitar información o documentación adicional que permita identificar al titular de la cuenta y conocer razonablemente la relación o justificación de su designación antes de aprobar el desembolso."
      },
      {
        "type": "paragraph",
        "text": "La solicitud comprenderá la totalidad de los Fondos Disponibles para Desembolso al momento de la solicitud, previa deducción de las comisiones y demás cargos aplicables de conformidad con los presentes Términos y la Política de Desembolsos de Minka."
      },
      {
        "type": "paragraph",
        "text": "Toda solicitud de desembolso estará sujeta a revisión por parte de Minka antes de su aprobación y procesamiento. Minka podrá solicitar información o documentación adicional o suspender temporalmente el procesamiento cuando existan inconsistencias, sea necesario verificar la disponibilidad efectiva de los fondos o concurran otras circunstancias previstas en los presentes Términos o en la Política de Desembolsos de Minka."
      },
      {
        "type": "section",
        "text": "7.2. Procesamiento y ejecución del desembolso"
      },
      {
        "type": "paragraph",
        "text": "Toda solicitud de desembolso será revisada por Minka antes de su aprobación. Como parte de esta revisión, Minka verificará la disponibilidad efectiva de los Fondos Disponibles para Desembolso y podrá revisar la información necesaria para procesar la transferencia."
      },
      {
        "type": "paragraph",
        "text": "Una vez aprobada la solicitud, Minka procesará el desembolso en un plazo máximo de tres (3) días hábiles, salvo que existan circunstancias ajenas al control razonable de Minka, incidencias técnicas, requerimientos de las entidades financieras intervinientes u otras situaciones que impidan o retrasen temporalmente la ejecución de la transferencia."
      },
      {
        "type": "paragraph",
        "text": "El desembolso será realizado a la cuenta bancaria proporcionada por la Persona Organizadora al momento de efectuar la solicitud. La Persona Organizadora es responsable de verificar la exactitud de la información bancaria consignada."
      },
      {
        "type": "paragraph",
        "text": "Cuando Minka ejecute correctamente la transferencia conforme a la información proporcionada por la Persona Organizadora, no será responsable por errores en la identificación de la cuenta bancaria ni por la transferencia de los fondos a una cuenta incorrectamente consignada por esta."
      },
      {
        "type": "paragraph",
        "text": "Si la transferencia no pudiera completarse y los fondos no hubieran sido efectivamente transferidos, Minka podrá contactar a la Persona Organizadora para solicitar la corrección o actualización de la información necesaria y procesar nuevamente el desembolso."
      },
      {
        "type": "section",
        "text": "7.3. Comisiones y monto neto del desembolso"
      },
      {
        "type": "paragraph",
        "text": "Minka aplicará las comisiones correspondientes a las Donaciones recibidas a través de la Plataforma, de acuerdo con el medio de pago utilizado y las condiciones vigentes informadas por Minka."
      },
      {
        "type": "paragraph",
        "text": "Las comisiones aplicables serán informadas a la Persona Organizadora a través de la Plataforma o de los medios habilitados por Minka y podrán incluir los costos asociados al procesamiento de pagos y la comisión correspondiente por el uso de los servicios de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Al momento de procesar el desembolso, Minka deducirá de los Fondos Disponibles para Desembolso las comisiones y demás cargos aplicables. La Persona Organizadora recibirá, o instruirá que se transfiera a la cuenta bancaria designada, el monto neto resultante de dichas deducciones."
      },
      {
        "type": "paragraph",
        "text": "El monto total histórico de las Donaciones realizadas a una Campaña podrá reflejarse públicamente en la Plataforma sin deducción de las comisiones y demás cargos aplicables. En consecuencia, el monto recaudado mostrado en la Campaña podrá ser distinto de los Fondos Disponibles para Desembolso y del monto neto efectivamente transferido a la cuenta bancaria designada por la Persona Organizadora."
      },
      {
        "type": "section",
        "text": "7.4. Desembolsos sucesivos"
      },
      {
        "type": "paragraph",
        "text": "La realización de un desembolso no implica, por sí misma, la finalización de la Campaña."
      },
      {
        "type": "paragraph",
        "text": "Cuando la Campaña permanezca vigente después de un desembolso, podrá continuar recibiendo Donaciones y la Persona Organizadora podrá solicitar nuevos desembolsos de los Fondos Disponibles para Desembolso, de conformidad con las condiciones y periodicidad establecidas en la Política de Desembolsos de Minka."
      },
      {
        "type": "paragraph",
        "text": "Cada nueva solicitud de desembolso estará sujeta al procedimiento de revisión, aprobación y procesamiento previsto en los presentes Términos y en la Política de Desembolsos de Minka."
      },
      {
        "type": "paragraph",
        "text": "Los desembolsos previamente realizados no modificarán el monto histórico total de los Fondos Recaudados que pueda mostrarse en la Campaña. Las nuevas Donaciones se acumularán sobre dicho monto histórico, sin que ello implique que la totalidad del monto reflejado públicamente se encuentre disponible para un nuevo desembolso."
      },
      {
        "type": "section",
        "text": "7.5. Suspensión temporal del desembolso"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá suspender temporalmente el procesamiento de una solicitud de desembolso cuando existan indicios razonables de fraude, uso indebido de la Plataforma, posible finalidad ilícita de la Campaña, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo, inconsistencias en la información proporcionada, patrones inusuales de Donaciones u operaciones, controversias relacionadas con la Campaña o cualquier otra circunstancia que requiera una revisión adicional conforme a los presentes Términos y las Políticas de Minka."
      },
      {
        "type": "paragraph",
        "text": "Durante la suspensión, Minka podrá solicitar a la Persona Organizadora la información o documentación adicional que resulte razonablemente necesaria para aclarar la situación identificada."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora deberá colaborar con el proceso de revisión y proporcionar la información o documentación solicitada dentro del plazo que Minka le comunique, atendiendo a las circunstancias del caso."
      },
      {
        "type": "paragraph",
        "text": "Minka comunicará a la Persona Organizadora la suspensión de la solicitud de desembolso, salvo que exista una disposición legal, requerimiento de autoridad competente o razón de seguridad que impida realizar dicha comunicación."
      },
      {
        "type": "paragraph",
        "text": "La suspensión se mantendrá durante el tiempo razonablemente necesario para realizar la revisión correspondiente. Una vez concluida, Minka podrá aprobar y procesar el desembolso, mantener la suspensión cuando subsistan las circunstancias que la motivaron o adoptar las medidas previstas en los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "La suspensión temporal de un desembolso no implica, por sí misma, una determinación de fraude, ilicitud o incumplimiento por parte de la Persona Organizadora o del Beneficiario."
      },
      {
        "type": "section",
        "text": "7.6. Imposibilidad o rechazo del desembolso"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá rechazar una solicitud de desembolso cuando, como resultado del proceso de revisión, determine que existen circunstancias que impiden procesar la transferencia de conformidad con los presentes Términos, las Políticas de Minka o la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "Entre otras circunstancias, el desembolso podrá ser rechazado cuando se compruebe una finalidad ilícita de la Campaña, existan elementos suficientes que evidencien fraude, uso indebido de la Plataforma, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo u otras actividades ilícitas; la Persona Organizadora incumpla injustificadamente con la entrega de información o documentación solicitada; exista una disposición de autoridad competente; o concurra cualquier otra circunstancia que legalmente impida la transferencia de los fondos."
      },
      {
        "type": "paragraph",
        "text": "Minka comunicará a la Persona Organizadora el rechazo del desembolso, salvo que una disposición legal, requerimiento de autoridad competente o razón de seguridad impida realizar dicha comunicación."
      },
      {
        "type": "paragraph",
        "text": "Cuando un desembolso sea rechazado, los Fondos Disponibles para Desembolso que no hubieran sido transferidos recibirán el tratamiento que corresponda atendiendo a las circunstancias del caso, la normativa aplicable, las condiciones de los medios de pago, los Procesadores de Pagos y las demás entidades intervinientes y, cuando corresponda, las instrucciones de la autoridad competente."
      },
      {
        "type": "paragraph",
        "text": "El rechazo de un desembolso no otorga a Minka derecho a apropiarse de los fondos recaudados ni de los Fondos Disponibles para Desembolso."
      },
      {
        "type": "section",
        "text": "7.7. Reversiones posteriores al desembolso"
      },
      {
        "type": "paragraph",
        "text": "Cuando una Donación sea revertida, desconocida o anulada a través del medio de pago utilizado con posterioridad al procesamiento de un desembolso que la hubiera incluido, y dicha reversión genere un perjuicio económico, Minka podrá requerir a la Persona Organizadora la restitución del monto correspondiente."
      },
      {
        "type": "paragraph",
        "text": "Cuando corresponda, Minka podrá compensar dicho monto contra los Fondos Disponibles para Desembolso de la misma Campaña o de otras Campañas de la misma Persona Organizadora, o requerir su restitución por los medios que resulten procedentes, sin perjuicio de las demás medidas previstas en los presentes Términos y Condiciones."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora deberá colaborar razonablemente con Minka durante la revisión de la reversión y proporcionar la información o documentación que le sea solicitada cuando resulte necesaria para la gestión del caso."
      },
      {
        "type": "paragraph",
        "text": "La presente disposición no será aplicable cuando la reversión sea consecuencia exclusiva de un error atribuible a Minka o a un tercero por cuya actuación Minka sea legalmente responsable."
      },
      {
        "type": "section",
        "text": "7.8. Fondos no reclamados"
      },
      {
        "type": "paragraph",
        "text": "Cuando hayan transcurrido treinta (30) días calendario desde la finalización de una Campaña sin que la Persona Organizadora hubiera solicitado el desembolso de los Fondos Disponibles para Desembolso, Minka podrá iniciar un procedimiento de recordatorio utilizando los datos de contacto asociados a la cuenta de la Persona Organizadora."
      },
      {
        "type": "paragraph",
        "text": "Minka realizará las gestiones razonablemente disponibles para comunicar la existencia de los Fondos Disponibles para Desembolso y solicitar que la Persona Organizadora complete el procedimiento correspondiente."
      },
      {
        "type": "paragraph",
        "text": "Si, pese a dichas gestiones, la Persona Organizadora no respondiera o no solicitara el desembolso, Minka podrá considerar iniciado el procedimiento de fondos no reclamados."
      },
      {
        "type": "paragraph",
        "text": "Si transcurrido un (1) año desde el inicio del procedimiento de fondos no reclamados la Persona Organizadora no hubiera solicitado el desembolso ni respondido a las comunicaciones realizadas por Minka, se entenderá que la Persona Organizadora renuncia de manera expresa e irrevocable al derecho de solicitar el desembolso de dichos fondos, autorizando a Minka a destinarlos al sostenimiento, operación y mejora de la Plataforma, con la finalidad de fortalecer la continuidad y el impacto de los servicios de crowdfunding social ofrecidos por Minka, de conformidad con los presentes Términos y Condiciones."
      },
      {
        "type": "paragraph",
        "text": "Lo dispuesto en el presente artículo únicamente será aplicable cuando la Persona Organizadora hubiera aceptado expresamente esta condición mediante el mecanismo de aceptación específico habilitado por Minka al momento de crear o publicar la Campaña."
      },
      {
        "type": "paragraph",
        "text": "La presente disposición no será aplicable cuando exista una controversia pendiente, un requerimiento de autoridad competente, una medida judicial o cualquier otra circunstancia que impida legalmente disponer de los fondos."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 8. OBLIGACIONES Y RESPONSABILIDADES"
      },
      {
        "type": "section",
        "text": "8.1. Obligaciones de la Persona Organizadora"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora es responsable de la creación, administración y gestión de las Campañas que publique a través de la Plataforma y deberá actuar de buena fe y de conformidad con los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "En particular, la Persona Organizadora deberá:"
      },
      {
        "type": "listItem",
        "text": "a) proporcionar información verdadera, clara, suficiente y no engañosa en relación con su identidad, la Campaña y, cuando corresponda, el Beneficiario;"
      },
      {
        "type": "listItem",
        "text": "b) utilizar la Plataforma y los Fondos Recaudados para fines lícitos y de manera coherente con la finalidad informada en la Campaña;"
      },
      {
        "type": "listItem",
        "text": "c) mantener razonablemente actualizada la información de la Campaña cuando existan hechos relevantes que puedan afectar significativamente la comprensión de su finalidad o desarrollo;"
      },
      {
        "type": "listItem",
        "text": "d) no suplantar la identidad de terceros ni utilizar información, documentación o contenido de terceros de manera ilícita o indebida;"
      },
      {
        "type": "listItem",
        "text": "e) proporcionar información y documentación auténtica cuando solicite la Verificación de una Campaña o cuando Minka la requiera en ejercicio de sus facultades de revisión y supervisión;"
      },
      {
        "type": "listItem",
        "text": "f) colaborar razonablemente con Minka en los procesos de revisión, Verificación de Campañas o supervisión relacionados con la Campaña;"
      },
      {
        "type": "listItem",
        "text": "g) verificar la exactitud de la información bancaria proporcionada para el procesamiento de los desembolsos;"
      },
      {
        "type": "listItem",
        "text": "h) abstenerse de utilizar la Plataforma, las Campañas o los procesos de desembolso para ocultar, encubrir, transferir o facilitar la circulación de fondos de origen ilícito o para realizar operaciones destinadas a dificultar la identificación de su origen, destino o titularidad; y"
      },
      {
        "type": "listItem",
        "text": "i) cumplir las demás obligaciones previstas en los presentes Términos y en las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora será responsable de la información y demás contenido que publique, de la administración de su Campaña y del uso que realice de los Fondos Recaudados."
      },
      {
        "type": "paragraph",
        "text": "Minka no asume las obligaciones ni responsabilidades de la Persona Organizadora y no garantiza el cumplimiento de las obligaciones o compromisos asumidos por esta frente a las Personas Donantes, el Beneficiario o terceros."
      },
      {
        "type": "section",
        "text": "8.2. Obligaciones de las Personas Donantes"
      },
      {
        "type": "paragraph",
        "text": "Las Personas Donantes deberán utilizar la Plataforma y los medios de pago habilitados de buena fe y de conformidad con los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "En particular, las Personas Donantes deberán:"
      },
      {
        "type": "listItem",
        "text": "a) proporcionar información verdadera y correcta cuando esta sea requerida durante el proceso de Donación;"
      },
      {
        "type": "listItem",
        "text": "b) utilizar únicamente medios de pago que se encuentren autorizadas a utilizar;"
      },
      {
        "type": "listItem",
        "text": "c) verificar la Campaña, el monto de la Donación y el medio de pago seleccionado antes de confirmar la operación;"
      },
      {
        "type": "listItem",
        "text": "d) abstenerse de realizar operaciones fraudulentas, desconocer indebidamente Donaciones realizadas o utilizar la Plataforma para fines ilícitos;"
      },
      {
        "type": "listItem",
        "text": "e) abstenerse de interferir, manipular o intentar alterar el proceso de Donación o los registros asociados a una operación; y"
      },
      {
        "type": "listItem",
        "text": "f) colaborar razonablemente con Minka cuando resulte necesario revisar una incidencia relacionada con una Donación o con el medio de pago utilizado."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Donantes son responsables de las decisiones que adopten respecto de las Campañas que decidan apoyar, de conformidad con la información disponible en la Plataforma y sin perjuicio de las facultades de Verificación de Campañas y supervisión de Minka."
      },
      {
        "type": "paragraph",
        "text": "Minka no garantiza el cumplimiento de la finalidad de una Campaña ni el destino final de los Fondos Recaudados."
      },
      {
        "type": "section",
        "text": "8.3. Responsabilidad respecto de los Beneficiarios"
      },
      {
        "type": "paragraph",
        "text": "Cuando una Campaña sea creada en beneficio de una persona distinta de la Persona Organizadora, esta será responsable de la información y demás contenido que publique sobre el Beneficiario, incluyendo su nombre, imagen, datos personales, documentos u otros contenidos relacionados con este."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora deberá respetar los derechos del Beneficiario y abstenerse de publicar información, imágenes, documentos u otros contenidos de manera ilícita, engañosa o que vulnere derechos de terceros."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora será responsable de valorar la pertinencia de publicar información o contenido de carácter sensible y de contar, cuando corresponda, con las autorizaciones necesarias para su difusión."
      },
      {
        "type": "paragraph",
        "text": "Minka no será responsable por la publicación voluntaria de fotografías, documentos, datos personales u otros contenidos de carácter sensible realizada por la Persona Organizadora a través de la Campaña, sin perjuicio de las facultades de Minka para revisar, limitar, ocultar o eliminar contenidos conforme a los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "La información y documentación proporcionada directamente a Minka para fines de Verificación de Campañas será tratada de conformidad con la Política de Privacidad de Minka y la Política de Verificación de Campañas de Minka. La entrega de dicha información o documentación a Minka para fines de Verificación de Campañas no implica su publicación en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La creación de una Campaña en beneficio de un tercero no convierte al Beneficiario en parte de la relación contractual entre Minka y la Persona Organizadora, salvo que el Beneficiario utilice directamente la Plataforma y quede sujeto a los presentes Términos en la calidad que corresponda."
      },
      {
        "type": "paragraph",
        "text": "Minka no garantiza la relación existente entre la Persona Organizadora y el Beneficiario ni asume responsabilidad por los acuerdos, compromisos o controversias que puedan surgir entre ellos, sin perjuicio de sus facultades de supervisión conforme a los presentes Términos."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 9. USOS, ACTIVIDADES Y CONTENIDOS PROHIBIDOS"
      },
      {
        "type": "section",
        "text": "9.1. Prohibiciones generales"
      },
      {
        "type": "paragraph",
        "text": "La Plataforma no podrá ser utilizada para crear, promover, financiar o facilitar Campañas, actividades, contenidos u operaciones contrarias a la normativa aplicable, a los presentes Términos o a las Políticas de Minka."
      },
      {
        "type": "paragraph",
        "text": "En particular, queda prohibido utilizar la Plataforma para:"
      },
      {
        "type": "listItem",
        "text": "a) crear, promover o financiar Campañas con finalidades ilícitas o fraudulentas, o destinadas a facilitar, financiar o encubrir actividades contrarias a la normativa aplicable;"
      },
      {
        "type": "listItem",
        "text": "b) proporcionar información falsa, engañosa o que pueda inducir a error respecto de la Campaña, la Persona Organizadora, el Beneficiario o la finalidad de la recaudación;"
      },
      {
        "type": "listItem",
        "text": "c) suplantar la identidad de otra persona o utilizar indebidamente nombres, imágenes, documentos, datos personales u otra información de terceros;"
      },
      {
        "type": "listItem",
        "text": "d) publicar contenidos que vulneren derechos de terceros o que sean discriminatorios, amenazantes, violentos, de explotación o contrarios a la dignidad de las personas;"
      },
      {
        "type": "listItem",
        "text": "e) publicar, promover, financiar o facilitar contenido pornográfico o sexualmente explícito;"
      },
      {
        "type": "listItem",
        "text": "f) promover, facilitar o financiar la trata de personas, la explotación sexual, el abuso o explotación de niñas, niños o adolescentes u otras formas de violencia o explotación;"
      },
      {
        "type": "listItem",
        "text": "g) crear, promover o financiar Campañas destinadas directamente al financiamiento de partidos políticos, organizaciones políticas, candidaturas o campañas electorales;"
      },
      {
        "type": "listItem",
        "text": "h) realizar operaciones fraudulentas, utilizar medios de pago sin autorización o manipular indebidamente los procesos de Donación, recaudación o desembolso;"
      },
      {
        "type": "listItem",
        "text": "i) utilizar la Plataforma para la Legitimación de Ganancias Ilícitas, el Financiamiento del Terrorismo o cualquier otra actividad destinada a ocultar, encubrir o dificultar la identificación del origen, destino o titularidad de fondos de origen ilícito;"
      },
      {
        "type": "listItem",
        "text": "j) interferir, alterar o afectar el funcionamiento de la Plataforma, vulnerar sus mecanismos de seguridad o intentar acceder de manera no autorizada a cuentas, sistemas, datos o funcionalidades;"
      },
      {
        "type": "listItem",
        "text": "k) utilizar mecanismos automatizados, programas u otros medios destinados a manipular el funcionamiento de la Plataforma o generar información, interacciones u operaciones falsas o engañosas; o"
      },
      {
        "type": "listItem",
        "text": "l) realizar cualquier otra actividad que constituya un uso ilícito, fraudulento o abusivo de la Plataforma o que pueda afectar razonablemente su seguridad, integridad o funcionamiento."
      },
      {
        "type": "paragraph",
        "text": "La presente enumeración no es limitativa. Minka podrá revisar cualquier Campaña, contenido, actividad u operación cuando existan indicios razonables de un posible incumplimiento de los presentes Términos, de las Políticas de Minka o de la normativa aplicable, de conformidad con las facultades de supervisión previstas en estos Términos."
      },
      {
        "type": "section",
        "text": "9.2. Consecuencias del incumplimiento"
      },
      {
        "type": "paragraph",
        "text": "El incumplimiento de las prohibiciones previstas en el presente Capítulo podrá dar lugar a la adopción de medidas por parte de Minka, atendiendo a la naturaleza y gravedad de la situación identificada y de conformidad con los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Entre otras medidas, Minka podrá limitar o suspender el acceso a determinadas funcionalidades de la Plataforma, suspender o dar por finalizada una Campaña, limitar, ocultar o eliminar contenidos, suspender temporalmente el procesamiento de desembolsos o adoptar cualquier otra medida prevista en los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Cuando los hechos pudieran constituir una infracción a la normativa aplicable o requieran la intervención de una autoridad competente, Minka podrá proporcionar la información que corresponda y colaborar con las autoridades, de conformidad con la normativa aplicable y la Política de Privacidad de Minka."
      },
      {
        "type": "paragraph",
        "text": "La adopción de las medidas previstas en el presente artículo no impedirá que Minka ejerza las acciones que legalmente le correspondan cuando el uso indebido de la Plataforma cause daños o afecte sus derechos o los de terceros."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 10. FACULTADES DE SUPERVISIÓN DE MINKA"
      },
      {
        "type": "section",
        "text": "10.1. Facultades generales de supervisión"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá revisar las Campañas, cuentas, contenidos y operaciones realizadas a través de la Plataforma cuando existan indicios razonables de un posible incumplimiento de los presentes Términos, de las Políticas de Minka o de la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "En ejercicio de sus facultades de supervisión, Minka podrá solicitar a la Persona Usuaria información, aclaraciones o documentación adicional que resulte razonablemente necesaria para analizar la situación identificada."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Usuarias deberán colaborar razonablemente con los procesos de revisión y supervisión y proporcionar la información o documentación solicitada dentro del plazo comunicado por Minka, atendiendo a las circunstancias del caso."
      },
      {
        "type": "paragraph",
        "text": "El ejercicio de las facultades de supervisión no implica que Minka asuma la obligación de revisar previamente todas las Campañas, contenidos u operaciones realizadas a través de la Plataforma ni constituye una garantía sobre su legalidad, veracidad, autenticidad o cumplimiento futuro."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá aplicar medidas razonables de prevención y gestión de riesgos destinadas a identificar operaciones, comportamientos o patrones inusuales que pudieran estar relacionados con fraude, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo u otras actividades ilícitas. Para estos fines, Minka podrá revisar información relacionada con las cuentas, Campañas, Donaciones y solicitudes de desembolso, así como solicitar información, aclaraciones o documentación adicional cuando resulte razonablemente necesario."
      },
      {
        "type": "paragraph",
        "text": "La aplicación de estas medidas podrá considerar, entre otros elementos, la naturaleza y finalidad de la Campaña, el comportamiento de las Donaciones, la frecuencia o características de las operaciones, la información de la Persona Organizadora, del Beneficiario y de la cuenta bancaria designada para el desembolso, así como cualquier inconsistencia relevante identificada por Minka."
      },
      {
        "type": "paragraph",
        "text": "Para estos fines, Minka cuenta con procedimientos internos de prevención y gestión de riesgos destinados a orientar la identificación, revisión y atención de posibles casos de fraude, uso indebido de la Plataforma, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo u otras actividades ilícitas. Los criterios, medidas y mecanismos internos de revisión tendrán carácter confidencial cuando su divulgación pueda afectar la seguridad o efectividad de los controles de Minka."
      },
      {
        "type": "section",
        "text": "10.2. Medidas de supervisión"
      },
      {
        "type": "paragraph",
        "text": "Cuando existan indicios razonables de un posible incumplimiento de los presentes Términos, de las Políticas de Minka o de la normativa aplicable, Minka podrá adoptar las medidas que resulten razonablemente necesarias atendiendo a la naturaleza y gravedad de la situación identificada."
      },
      {
        "type": "paragraph",
        "text": "Entre otras medidas, Minka podrá:"
      },
      {
        "type": "listItem",
        "text": "a) solicitar información, aclaraciones o documentación adicional;"
      },
      {
        "type": "listItem",
        "text": "b) limitar temporalmente el acceso a determinadas funcionalidades de la Plataforma;"
      },
      {
        "type": "listItem",
        "text": "c) limitar, ocultar o eliminar contenidos;"
      },
      {
        "type": "listItem",
        "text": "d) suspender temporalmente o dar por finalizada una Campaña;"
      },
      {
        "type": "listItem",
        "text": "e) suspender temporalmente el procesamiento de una solicitud de desembolso;"
      },
      {
        "type": "listItem",
        "text": "f) rechazar una solicitud de desembolso en los casos previstos en los presentes Términos;"
      },
      {
        "type": "listItem",
        "text": "g) suspender temporalmente una cuenta; o"
      },
      {
        "type": "listItem",
        "text": "h) adoptar cualquier otra medida razonablemente necesaria para proteger la seguridad, integridad y adecuado funcionamiento de la Plataforma, cumplir la normativa aplicable o atender un requerimiento de autoridad competente."
      },
      {
        "type": "paragraph",
        "text": "Las medidas adoptadas por Minka podrán mantenerse durante el tiempo razonablemente necesario para revisar la situación identificada o mientras subsistan las circunstancias que las motivaron."
      },
      {
        "type": "paragraph",
        "text": "Cuando corresponda, Minka podrá comunicar a la Persona Usuaria las medidas adoptadas y solicitar su colaboración para aclarar o subsanar la situación identificada, salvo que exista una disposición legal, requerimiento de autoridad competente o razón de seguridad que impida realizar dicha comunicación."
      },
      {
        "type": "section",
        "text": "10.3. Suspensión y cierre de cuentas"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá suspender temporalmente una cuenta cuando existan indicios razonables de fraude, uso indebido de la Plataforma, suplantación de identidad, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo u otras actividades ilícitas, incumplimiento de los presentes Términos o de las Políticas de Minka, riesgos para la seguridad de la Plataforma u otras circunstancias que requieran una revisión adicional."
      },
      {
        "type": "paragraph",
        "text": "Durante la suspensión, Minka podrá limitar el acceso de la Persona Usuaria a la cuenta o a determinadas funcionalidades de la Plataforma mientras realiza la revisión correspondiente."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá cerrar una cuenta cuando se compruebe un incumplimiento grave o reiterado de los presentes Términos, la utilización de la Plataforma para finalidades ilícitas o fraudulentas, incluyendo actividades relacionadas con Legitimación de Ganancias Ilícitas o Financiamiento del Terrorismo, la suplantación de identidad, la afectación intencional de la seguridad o funcionamiento de la Plataforma o cuando exista una disposición de autoridad competente."
      },
      {
        "type": "paragraph",
        "text": "La suspensión o cierre de una cuenta no extingue las obligaciones previamente asumidas por la Persona Usuaria ni afecta las Donaciones realizadas, los desembolsos efectuados, las obligaciones pendientes o las actuaciones que deban continuar conforme a los presentes Términos, las Políticas de Minka o la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "Cuando una cuenta sea suspendida o cerrada y existan Campañas, Fondos Disponibles para Desembolso o solicitudes de desembolso vinculadas a esta, Minka podrá adoptar las medidas necesarias para revisar y gestionar dichas situaciones de conformidad con los presentes Términos y la Política de Desembolsos de Minka."
      },
      {
        "type": "section",
        "text": "10.4. Colaboración con autoridades competentes"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá proporcionar información y colaborar con autoridades judiciales, administrativas, regulatorias o de otra naturaleza cuando exista una obligación legal, una orden o requerimiento emitido por autoridad competente o cuando dicha colaboración resulte necesaria de conformidad con la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "La entrega o comunicación de información se realizará de conformidad con la normativa aplicable y la Política de Privacidad de Minka."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá adoptar las medidas necesarias para preservar información, registros o documentación relacionada con una cuenta, Campaña, Donación, desembolso u operación cuando exista un requerimiento de autoridad competente o una obligación legal de conservación."
      },
      {
        "type": "paragraph",
        "text": "Cuando la normativa aplicable o una instrucción de autoridad competente lo permita, Minka podrá comunicar a la Persona Usuaria la existencia del requerimiento o de las medidas adoptadas."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 11. PROPIEDAD INTELECTUAL"
      },
      {
        "type": "section",
        "text": "11.1. Propiedad intelectual de Minka"
      },
      {
        "type": "paragraph",
        "text": "La Plataforma, su diseño, estructura, funcionalidades, interfaces, elementos gráficos, textos institucionales, materiales y demás contenidos desarrollados o utilizados por Minka se encuentran protegidos por la normativa aplicable en materia de propiedad intelectual, en la medida que corresponda."
      },
      {
        "type": "paragraph",
        "text": "La titularidad de los derechos sobre dichos elementos corresponderá a Minka o a los terceros que hayan autorizado su utilización, según corresponda."
      },
      {
        "type": "paragraph",
        "text": "El acceso o utilización de la Plataforma no otorga a las Personas Usuarias derechos de propiedad, titularidad o explotación sobre los elementos protegidos de Minka."
      },
      {
        "type": "paragraph",
        "text": "Salvo autorización previa y expresa de Minka o disposición permitida por la normativa aplicable, las Personas Usuarias no podrán reproducir, modificar, distribuir, comercializar, explotar o utilizar los elementos protegidos de la Plataforma para finalidades distintas del uso normal de los servicios ofrecidos por Minka."
      },
      {
        "type": "paragraph",
        "text": "Las referencias a la denominación, identidad visual, logotipo u otros signos utilizados por Minka en la Plataforma no deberán interpretarse, por sí mismas, como una declaración de registro o concesión de derechos marcarios, sin perjuicio de la protección que pudiera corresponder conforme a la normativa aplicable."
      },
      {
        "type": "section",
        "text": "11.2. Contenido publicado por la Persona Organizadora"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora conserva los derechos que le correspondan sobre la información, textos, fotografías, imágenes, videos, logotipos y demás contenidos que publique en una Campaña."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora declara que cuenta con los derechos, autorizaciones o facultades necesarias para publicar y utilizar los contenidos incorporados a su Campaña y será responsable por cualquier vulneración de derechos de propiedad intelectual, derechos de imagen, privacidad u otros derechos de terceros derivados de su publicación."
      },
      {
        "type": "paragraph",
        "text": "La publicación de contenido en la Plataforma no implica la transferencia de su titularidad a Minka, sin perjuicio de la autorización de uso prevista en el artículo 11.3 de los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá limitar, ocultar o eliminar contenidos cuando existan indicios razonables de que vulneran derechos de terceros, incumplen los presentes Términos o las Políticas de Minka, o cuando exista un requerimiento de autoridad competente."
      },
      {
        "type": "section",
        "text": "11.3. Autorización de uso del contenido por Minka"
      },
      {
        "type": "paragraph",
        "text": "Al publicar contenido en una Campaña, la Persona Organizadora autoriza a Minka, de manera gratuita y no exclusiva, a utilizar, reproducir, mostrar, comunicar y difundir dicho contenido en la Plataforma y en los canales institucionales de Minka, incluidos sus sitios web y redes sociales."
      },
      {
        "type": "paragraph",
        "text": "Esta autorización se limita a las finalidades de funcionamiento, difusión y promoción de la Campaña, así como a la comunicación y promoción de la Plataforma y de los servicios de Minka."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá utilizar el contenido públicamente disponible de Campañas activas o finalizadas para comunicar historias de impacto, resultados de recaudación o casos de éxito relacionados con el uso de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La autorización prevista en el presente artículo comprende únicamente el contenido publicado por la Persona Organizadora en la Campaña y no se extiende a la información o documentación proporcionada directamente a Minka para fines de Verificación de Campañas, la cual será tratada de conformidad con la Política de Privacidad de Minka y la Política de Verificación de Campañas de Minka."
      },
      {
        "type": "paragraph",
        "text": "La autorización otorgada no implica la transferencia de la titularidad del contenido a Minka ni autoriza su comercialización independiente o su utilización para finalidades ajenas a las previstas en el presente artículo."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá realizar las adaptaciones técnicas, gráficas o de formato razonablemente necesarias para la publicación o difusión del contenido, siempre que dichas adaptaciones no alteren de manera sustancial su sentido."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 12. PROTECCIÓN DE DATOS Y PRIVACIDAD"
      },
      {
        "type": "section",
        "text": "12.1. Tratamiento de datos personales"
      },
      {
        "type": "paragraph",
        "text": "Minka recopila y trata datos personales de las personas que acceden o utilizan la Plataforma, de conformidad con la normativa aplicable y la Política de Privacidad de Minka."
      },
      {
        "type": "paragraph",
        "text": "El tratamiento de datos personales podrá realizarse para permitir el funcionamiento de la Plataforma, gestionar cuentas, Campañas, Donaciones y desembolsos, realizar procesos de Verificación de Campañas y supervisión, atender consultas, denuncias o reclamaciones, prevenir usos fraudulentos o ilícitos de la Plataforma y cumplir las obligaciones legales que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "Los datos personales tratados por Minka podrán variar según la forma en que cada persona interactúe con la Plataforma y los servicios o funcionalidades que utilice."
      },
      {
        "type": "paragraph",
        "text": "Las condiciones específicas relativas a la recopilación, utilización, conservación, protección y, cuando corresponda, comunicación de datos personales se encuentran desarrolladas en la Política de Privacidad de Minka."
      },
      {
        "type": "section",
        "text": "12.2. Política de Privacidad de Minka"
      },
      {
        "type": "paragraph",
        "text": "El tratamiento de datos personales realizado por Minka se regirá por la Política de Privacidad de Minka, en la que se desarrollan las condiciones aplicables a la recopilación, utilización, conservación, protección y, cuando corresponda, comunicación de datos personales."
      },
      {
        "type": "paragraph",
        "text": "La Política de Privacidad de Minka forma parte del marco aplicable al uso de la Plataforma y deberá ser consultada por las Personas Usuarias y demás personas que interactúen con Minka para conocer con mayor detalle las prácticas de Minka en materia de privacidad y tratamiento de datos personales."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá actualizar la Política de Privacidad de Minka cuando resulte necesario para reflejar cambios en sus prácticas, funcionalidades, servicios o en la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "Las modificaciones serán comunicadas o puestas a disposición a través de la Plataforma o de otros medios razonablemente adecuados, atendiendo a la naturaleza de los cambios realizados."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 13. LIMITACIÓN DE RESPONSABILIDAD"
      },
      {
        "type": "section",
        "text": "13.1. Alcance de la responsabilidad de Minka"
      },
      {
        "type": "paragraph",
        "text": "Minka proporciona una infraestructura tecnológica que permite la creación y difusión de Campañas, la realización de Donaciones y la gestión de los procesos de desembolso de los Fondos Disponibles para Desembolso, de conformidad con las funcionalidades disponibles en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Minka no crea ni organiza las Campañas publicadas por las Personas Organizadoras ni determina su finalidad, contenido o forma de ejecución. La responsabilidad por la creación, administración y desarrollo de una Campaña, la información y demás contenido publicado y el uso de los Fondos Recaudados corresponde a la Persona Organizadora, de conformidad con los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Minka no garantiza el éxito de una Campaña, el cumplimiento de su meta económica, la cantidad de Donaciones que pueda recibir ni la obtención de resultados específicos derivados de la recaudación."
      },
      {
        "type": "paragraph",
        "text": "Las facultades de Verificación de Campañas y supervisión ejercidas por Minka no implican que Minka asuma las obligaciones o responsabilidades de la Persona Organizadora ni constituyen una garantía sobre la autenticidad absoluta de la información proporcionada, la conducta futura de la Persona Organizadora o del Beneficiario, el cumplimiento de la finalidad de la Campaña o el destino final de los Fondos Recaudados."
      },
      {
        "type": "paragraph",
        "text": "Minka será responsable por las obligaciones que expresamente asuma en los presentes Términos y de conformidad con la normativa aplicable."
      },
      {
        "type": "section",
        "text": "13.2. Disponibilidad y funcionamiento de la Plataforma"
      },
      {
        "type": "paragraph",
        "text": "Minka procurará mantener la Plataforma disponible y en adecuado funcionamiento. No obstante, el acceso o utilización de la Plataforma podrá verse temporalmente interrumpido, limitado o afectado por labores de mantenimiento, actualizaciones, circunstancias técnicas, problemas de conectividad, fallas de servicios de terceros u otras situaciones que puedan afectar su funcionamiento."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá realizar labores de mantenimiento, actualización o modificación de la Plataforma cuando resulten necesarias para su funcionamiento, seguridad o mejora."
      },
      {
        "type": "paragraph",
        "text": "Minka no garantiza que la Plataforma se encuentre disponible de manera permanente, ininterrumpida o libre de incidencias técnicas. Las interrupciones, demoras o fallas temporales no implicarán, por sí mismas, un incumplimiento de los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Cuando una incidencia afecte el registro de una Donación, el procesamiento de una solicitud de desembolso u otra operación realizada a través de la Plataforma, Minka podrá revisar la operación y adoptar las medidas razonablemente necesarias para aclarar o corregir la situación, de conformidad con los presentes Términos y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "section",
        "text": "13.3. Servicios y proveedores de terceros"
      },
      {
        "type": "paragraph",
        "text": "Para el funcionamiento de la Plataforma, Minka podrá utilizar servicios proporcionados por terceros, incluyendo entidades financieras, Procesadores de Pagos, servicios de autenticación, infraestructura tecnológica y otros servicios necesarios para la operación de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "El acceso, disponibilidad y funcionamiento de dichos servicios se encuentran sujetos a las condiciones y sistemas de los respectivos proveedores. Minka no controla directamente su funcionamiento ni garantiza su disponibilidad permanente o ininterrumpida."
      },
      {
        "type": "paragraph",
        "text": "Las interrupciones, rechazos, demoras o incidencias atribuibles a servicios de terceros podrán afectar temporalmente determinadas funcionalidades de la Plataforma, incluyendo el procesamiento de Donaciones o desembolsos, sin que ello implique, por sí mismo, un incumplimiento de Minka."
      },
      {
        "type": "paragraph",
        "text": "Cuando una incidencia relacionada con un proveedor de servicios de terceros afecte una operación realizada a través de la Plataforma, Minka podrá realizar las gestiones razonablemente necesarias para revisar la situación y, cuando corresponda, coordinar con el proveedor interviniente, sin que ello implique garantizar un resultado específico o un plazo de resolución distinto al expresamente previsto en los presentes Términos."
      },
      {
        "type": "section",
        "text": "13.4. Daños y pérdidas derivados del uso de la Plataforma"
      },
      {
        "type": "paragraph",
        "text": "En la medida permitida por la normativa aplicable, Minka no será responsable por daños o pérdidas indirectas derivados de decisiones adoptadas por las Personas Usuarias con base en la información publicada por las Personas Organizadoras, del incumplimiento de obligaciones atribuibles a estas o del uso de los Fondos Recaudados una vez efectuado el desembolso correspondiente."
      },
      {
        "type": "paragraph",
        "text": "Minka tampoco será responsable por pérdidas derivadas de circunstancias ajenas a su control razonable, incluyendo interrupciones de servicios de terceros, problemas de conectividad o acontecimientos que impidan temporalmente el funcionamiento normal de la Plataforma, sin perjuicio de las obligaciones expresamente asumidas por Minka en los presentes Términos."
      },
      {
        "type": "paragraph",
        "text": "Ninguna disposición del presente Capítulo deberá interpretarse como una exclusión o limitación de responsabilidad de Minka en aquellos casos en que dicha responsabilidad no pueda ser excluida o limitada conforme a la normativa aplicable."
      },
      {
        "type": "section",
        "text": "13.5. Indemnidad"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora se obliga a mantener indemne a Minka frente a reclamos, demandas, procedimientos administrativos o judiciales, sanciones, daños, perjuicios, costos o gastos razonables, incluyendo honorarios profesionales y gastos de defensa, promovidos por terceros como consecuencia de:"
      },
      {
        "type": "listItem",
        "text": "a) la información, documentación o contenido publicado en su Campaña;"
      },
      {
        "type": "listItem",
        "text": "b) la vulneración de derechos de terceros;"
      },
      {
        "type": "listItem",
        "text": "c) el incumplimiento de los presentes Términos y Condiciones o de las Políticas de Minka;"
      },
      {
        "type": "listItem",
        "text": "d) el destino o utilización de los Fondos Recaudados; o"
      },
      {
        "type": "listItem",
        "text": "e) cualquier actuación u omisión atribuible a la Persona Organizadora relacionada con la Campaña, incluyendo aquellas vinculadas con el Beneficiario cuando actúe bajo su representación, coordinación o autorización."
      },
      {
        "type": "paragraph",
        "text": "Lo dispuesto en el presente artículo no será aplicable en la medida en que el reclamo, daño o perjuicio sea consecuencia de un incumplimiento o actuación directamente atribuible a Minka."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 14. MODIFICACIÓN DE LOS TÉRMINOS"
      },
      {
        "type": "section",
        "text": "14.1. Modificación de los Términos"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá modificar o actualizar los presentes Términos cuando resulte necesario para reflejar cambios en la Plataforma, sus funcionalidades, servicios, procesos operativos, Políticas de Minka o en la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "Las modificaciones serán publicadas o puestas a disposición a través de la Plataforma y entrarán en vigencia en la fecha que se indique en la versión actualizada de los Términos."
      },
      {
        "type": "paragraph",
        "text": "Cuando las modificaciones sean relevantes para el uso de la Plataforma o afecten de manera significativa las condiciones aplicables a las Personas Usuarias, Minka podrá comunicarlas a través de la Plataforma, del correo electrónico asociado a la cuenta u otros medios razonablemente adecuados."
      },
      {
        "type": "paragraph",
        "text": "La continuación en el uso de la Plataforma después de la entrada en vigencia de las modificaciones implicará la aceptación de los Términos actualizados. Cuando la naturaleza de la modificación lo requiera, Minka podrá solicitar una nueva aceptación expresa."
      },
      {
        "type": "paragraph",
        "text": "Las modificaciones de los presentes Términos no afectarán retroactivamente las Donaciones o desembolsos ya realizados, sin perjuicio de las disposiciones que deban aplicarse por mandato de la normativa o de una autoridad competente."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 15. LEY APLICABLE Y RESOLUCIÓN DE CONTROVERSIAS"
      },
      {
        "type": "section",
        "text": "15.1. Ley aplicable"
      },
      {
        "type": "paragraph",
        "text": "Los presentes Términos se regirán e interpretarán de conformidad con la normativa vigente del Estado Plurinacional de Bolivia."
      },
      {
        "type": "paragraph",
        "text": "La utilización de la Plataforma desde otros países no modificará la ley aplicable a los presentes Términos, sin perjuicio de las disposiciones imperativas que pudieran resultar aplicables conforme a la normativa correspondiente."
      },
      {
        "type": "section",
        "text": "15.2. Resolución de controversias"
      },
      {
        "type": "paragraph",
        "text": "Las controversias, diferencias o reclamaciones que surjan en relación con la interpretación, aplicación o cumplimiento de los presentes Términos procurarán resolverse inicialmente mediante comunicación directa y de buena fe entre la persona interesada y Minka, a través del canal oficial de atención habilitado por Minka e informado en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Cuando la controversia no pueda resolverse mediante comunicación directa, las partes procurarán acudir a un procedimiento de conciliación, de conformidad con la normativa aplicable en el Estado Plurinacional de Bolivia."
      },
      {
        "type": "paragraph",
        "text": "Si la controversia no fuera resuelta mediante conciliación y se tratara de una materia susceptible de arbitraje, las partes podrán someterla a arbitraje de conformidad con la normativa vigente en materia de conciliación y arbitraje del Estado Plurinacional de Bolivia."
      },
      {
        "type": "paragraph",
        "text": "Lo previsto en el presente artículo no limitará el ejercicio de los derechos, reclamaciones o acciones que, conforme a la normativa aplicable, no puedan ser objeto de renuncia, restricción, conciliación o arbitraje."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 16. DISPOSICIONES FINALES"
      },
      {
        "type": "section",
        "text": "16.1. Divisibilidad"
      },
      {
        "type": "paragraph",
        "text": "Si alguna disposición de los presentes Términos y Condiciones fuera declarada nula, inválida o inaplicable por una autoridad competente, las demás disposiciones conservarán su plena validez y eficacia."
      },
      {
        "type": "paragraph",
        "text": "La disposición afectada será interpretada o sustituida, en la medida de lo posible, de forma que produzca efectos compatibles con su finalidad original y con la normativa aplicable."
      },
      {
        "type": "section",
        "text": "16.2. Cesión"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá ceder o transferir su posición contractual, así como los derechos y obligaciones derivados de los presentes Términos y Condiciones, en el marco de una reorganización societaria, fusión, transferencia de negocio u otra operación equivalente, sin necesidad de obtener autorización previa de las Personas Usuarias, informándolo a través de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Las Personas Usuarias no podrán ceder su posición contractual ni los derechos y obligaciones derivados de los presentes Términos y Condiciones sin autorización previa y expresa de Minka."
      },
      {
        "type": "section",
        "text": "16.3. Obligaciones tributarias"
      },
      {
        "type": "paragraph",
        "text": "Cada Persona Usuaria es responsable del cumplimiento de las obligaciones tributarias, contables y de cualquier otra naturaleza que le correspondan conforme a la normativa aplicable, incluyendo, cuando corresponda, la declaración de los fondos recibidos a través de la Plataforma y el pago de los tributos que resulten exigibles."
      },
      {
        "type": "paragraph",
        "text": "Minka no asume las obligaciones tributarias de las Personas Usuarias ni emite certificados de donación con efectos tributarios, salvo que la normativa aplicable disponga expresamente lo contrario, sin perjuicio de las obligaciones fiscales propias de Minka respecto de las comisiones derivadas de sus servicios."
      },
      {
        "type": "paragraph",
        "text": "El hecho de que Minka no ejerza o retrase el ejercicio de cualquier derecho, facultad o medida prevista en los presentes Términos y Condiciones no constituirá una renuncia a dicho derecho, facultad o medida, ni impedirá su ejercicio posterior."
      }
    ]
  },
  {
    "id": "privacy",
    "slug": "politica-de-privacidad",
    "title": "POLÍTICA DE PRIVACIDAD DE MINKA",
    "updated": "Última actualización: julio de 2026",
    "blocks": [
      {
        "type": "title",
        "text": "POLÍTICA DE PRIVACIDAD DE MINKA"
      },
      {
        "type": "updated",
        "text": "Última actualización: julio de 2026"
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 1. OBJETO Y ALCANCE"
      },
      {
        "type": "section",
        "text": "1.1. Objeto"
      },
      {
        "type": "paragraph",
        "text": "La presente Política de Privacidad de Minka explica qué información personal puede recopilar Minka, cómo la utiliza, protege y, cuando corresponda, comparte en relación con el uso de la Plataforma y sus servicios."
      },
      {
        "type": "paragraph",
        "text": "La Plataforma es operada por Herbas Orias y Compañía Ltda., sociedad constituida conforme a las leyes del Estado Plurinacional de Bolivia (en adelante, \"Minka\"), responsable del tratamiento de la información personal descrito en la presente Política."
      },
      {
        "type": "paragraph",
        "text": "Esta Política complementa los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "section",
        "text": "1.2. Alcance"
      },
      {
        "type": "paragraph",
        "text": "La presente Política es aplicable al tratamiento de información personal realizado por Minka en relación con las Personas Usuarias, Personas Organizadoras, Personas Donantes, Beneficiarios y otras personas cuyos datos sean proporcionados a Minka a través de la Plataforma o en el marco de sus servicios."
      },
      {
        "type": "paragraph",
        "text": "Cuando una Persona Usuaria proporcione a Minka información personal de un Beneficiario, contacto de referencia u otra persona, declara que cuenta con autorización o fundamento suficiente para proporcionar dicha información para las finalidades relacionadas con la Campaña o los servicios de Minka."
      },
      {
        "type": "paragraph",
        "text": "Los términos utilizados con mayúscula inicial en la presente Política tendrán el significado establecido en los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 2. INFORMACIÓN QUE RECOPILAMOS"
      },
      {
        "type": "section",
        "text": "2.1. Información de cuenta y perfil"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá recopilar la información proporcionada al crear, completar o actualizar una cuenta, incluyendo nombres, apellidos, correo electrónico, fecha de nacimiento, número de documento de identidad, teléfono, ubicación, biografía e imagen de perfil."
      },
      {
        "type": "paragraph",
        "text": "Asimismo, Minka tratará la información necesaria para gestionar el acceso, autenticación y seguridad de la cuenta."
      },
      {
        "type": "section",
        "text": "2.2. Información de acceso y autenticación"
      },
      {
        "type": "paragraph",
        "text": "Cuando la Persona Usuaria utilice servicios de autenticación proporcionados por terceros, Minka podrá recibir la información necesaria para permitir el registro o acceso a la Plataforma, conforme a las condiciones y configuraciones del servicio utilizado."
      },
      {
        "type": "section",
        "text": "2.3. Información de Campañas y Verificación"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá recopilar la información proporcionada para crear, administrar y verificar una Campaña."
      },
      {
        "type": "paragraph",
        "text": "Para fines de Verificación, esta información podrá incluir documentos de identidad, documentación de respaldo, mensajes dirigidos a Minka y datos de contacto de personas de referencia."
      },
      {
        "type": "paragraph",
        "text": "Dependiendo de la naturaleza de la Campaña, la documentación proporcionada voluntariamente podrá contener información relacionada con la salud, situación personal u otras circunstancias del Beneficiario o de terceros."
      },
      {
        "type": "section",
        "text": "2.4. Información de Donaciones y operaciones"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá registrar información relacionada con las Donaciones y operaciones realizadas a través de la Plataforma, incluyendo la fecha y hora, identidad y correo electrónico de la Persona Donante cuando corresponda, Campaña destinataria, monto, medio de pago y estado de la operación."
      },
      {
        "type": "paragraph",
        "text": "Cuando una Donación se realice mediante tarjeta, la información necesaria para procesar el pago será gestionada directamente por el Procesador de Pagos correspondiente. Minka no almacena directamente los datos completos de la tarjeta ni los códigos de seguridad utilizados para realizar la operación."
      },
      {
        "type": "section",
        "text": "2.5. Información bancaria y de desembolsos"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá recopilar y tratar la información bancaria proporcionada para solicitar y procesar desembolsos, incluyendo el nombre del titular de la cuenta, número de cuenta, banco de destino y tipo de cuenta."
      },
      {
        "type": "paragraph",
        "text": "Minka también podrá conservar información relacionada con las solicitudes, revisión, procesamiento y estado de los desembolsos."
      },
      {
        "type": "section",
        "text": "2.6. Cookies y almacenamiento técnico"
      },
      {
        "type": "paragraph",
        "text": "Minka utiliza cookies y tecnologías de almacenamiento local o de sesión estrictamente necesarias para el funcionamiento de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Estas tecnologías podrán utilizarse para gestionar la autenticación y persistencia de la sesión, facilitar la recuperación de contraseña, recordar a la Persona Usuaria y permitir la continuidad de procesos iniciados en la Plataforma, incluyendo Donaciones o Campañas guardadas."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 3. USO DE LA INFORMACIÓN"
      },
      {
        "type": "section",
        "text": "3.1. Finalidades del tratamiento"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá utilizar la información recopilada para:"
      },
      {
        "type": "listItem",
        "text": "a) crear, administrar y proteger las cuentas de las Personas Usuarias;"
      },
      {
        "type": "listItem",
        "text": "b) permitir el acceso y uso de las funcionalidades de la Plataforma;"
      },
      {
        "type": "listItem",
        "text": "c) crear, publicar, administrar y verificar Campañas;"
      },
      {
        "type": "listItem",
        "text": "d) registrar, gestionar y dar seguimiento a las Donaciones y operaciones realizadas a través de la Plataforma;"
      },
      {
        "type": "listItem",
        "text": "e) revisar, aprobar y procesar solicitudes de desembolso;"
      },
      {
        "type": "listItem",
        "text": "f) comunicarse con las Personas Usuarias en relación con sus cuentas, Campañas, Donaciones, desembolsos, consultas o incidencias;"
      },
      {
        "type": "listItem",
        "text": "g) prevenir, identificar y gestionar riesgos de fraude, uso indebido de la Plataforma, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo u otras actividades ilícitas;"
      },
      {
        "type": "listItem",
        "text": "h) proteger la seguridad, integridad y funcionamiento de la Plataforma;"
      },
      {
        "type": "listItem",
        "text": "i) atender requerimientos de autoridades competentes y cumplir obligaciones legales; y"
      },
      {
        "type": "listItem",
        "text": "j) aplicar los Términos y Condiciones de Uso de la Plataforma Minka y las Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "Minka tratará la información personal únicamente para las finalidades relacionadas con sus servicios, el funcionamiento y seguridad de la Plataforma y el cumplimiento de sus obligaciones."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 4. COMPARTICIÓN DE INFORMACIÓN Y TERCEROS"
      },
      {
        "type": "section",
        "text": "4.1. Proveedores y servicios de terceros"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá compartir o permitir el acceso a información personal cuando resulte necesario para la prestación de sus servicios con proveedores tecnológicos, servicios de autenticación, Procesadores de Pagos, entidades financieras y otros proveedores que intervengan en el funcionamiento de la Plataforma o en el procesamiento de operaciones."
      },
      {
        "type": "paragraph",
        "text": "La información será compartida únicamente en la medida razonablemente necesaria para la prestación del servicio correspondiente."
      },
      {
        "type": "paragraph",
        "text": "La información personal podrá ser almacenada o tratada en servidores o servicios de infraestructura tecnológica ubicados fuera del Estado Plurinacional de Bolivia. En estos casos, Minka procurará que los proveedores correspondientes mantengan medidas de seguridad razonables para la protección de la información."
      },
      {
        "type": "section",
        "text": "4.2. Autoridades competentes"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá conservar, proporcionar o poner a disposición información cuando exista un requerimiento de autoridad competente o cuando resulte necesario para el cumplimiento de obligaciones legales, la prevención o investigación de actividades ilícitas o la protección de los derechos y seguridad de Minka, de las Personas Usuarias o de terceros."
      },
      {
        "type": "section",
        "text": "4.3. No comercialización de información personal"
      },
      {
        "type": "paragraph",
        "text": "Minka no vende ni comercializa la información personal recopilada a través de la Plataforma."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 5. CONSERVACIÓN, SEGURIDAD Y DERECHOS DE LAS PERSONAS"
      },
      {
        "type": "section",
        "text": "5.1. Conservación de la información"
      },
      {
        "type": "paragraph",
        "text": "Minka conservará la información personal durante el tiempo razonablemente necesario para prestar sus servicios, gestionar las cuentas, Campañas, Donaciones y desembolsos, cumplir obligaciones legales, atender controversias y proteger la seguridad e integridad de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "El cierre de una cuenta no implica necesariamente la eliminación inmediata de toda la información asociada. Minka podrá conservar aquella información que resulte razonablemente necesaria para las finalidades señaladas anteriormente."
      },
      {
        "type": "section",
        "text": "5.2. Seguridad de la información"
      },
      {
        "type": "paragraph",
        "text": "Minka adoptará medidas razonables de carácter técnico y organizativo destinadas a proteger la información personal frente al acceso, uso, alteración, pérdida o divulgación no autorizados."
      },
      {
        "type": "paragraph",
        "text": "No obstante, ningún sistema tecnológico o método de almacenamiento o transmisión de información puede garantizar una seguridad absoluta."
      },
      {
        "type": "section",
        "text": "5.3. Derechos y solicitudes sobre información personal"
      },
      {
        "type": "paragraph",
        "text": "Las personas podrán solicitar a Minka el acceso, actualización, corrección o eliminación de su información personal, cuando corresponda y de conformidad con la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá conservar determinada información cuando resulte necesario para cumplir obligaciones legales, atender controversias, prevenir fraude o actividades ilícitas, mantener registros de operaciones o proteger los derechos y seguridad de Minka o de terceros."
      },
      {
        "type": "paragraph",
        "text": "Las solicitudes deberán realizarse a través del canal oficial de atención habilitado por Minka e informado en la Plataforma."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 6. ACTUALIZACIÓN Y CONTACTO"
      },
      {
        "type": "section",
        "text": "6.1. Actualización de la Política"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá actualizar la presente Política cuando resulte necesario para reflejar cambios en la Plataforma, sus servicios, sus procesos de tratamiento de información o la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "Las modificaciones serán publicadas o puestas a disposición a través de la Plataforma."
      },
      {
        "type": "section",
        "text": "6.2. Contacto"
      },
      {
        "type": "paragraph",
        "text": "Las consultas o solicitudes relacionadas con la presente Política o con el tratamiento de información personal podrán realizarse a través del canal oficial de atención habilitado por Minka e informado en la Plataforma."
      }
    ]
  },
  {
    "id": "disbursements",
    "slug": "politica-de-desembolsos",
    "title": "POLÍTICA DE DESEMBOLSOS DE MINKA",
    "updated": "Última actualización: julio de 2026",
    "blocks": [
      {
        "type": "title",
        "text": "POLÍTICA DE DESEMBOLSOS DE MINKA"
      },
      {
        "type": "updated",
        "text": "Última actualización: julio de 2026"
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 1. OBJETO Y ALCANCE"
      },
      {
        "type": "section",
        "text": "1.1. Objeto"
      },
      {
        "type": "paragraph",
        "text": "La presente Política de Desembolsos de Minka establece las condiciones y el procedimiento aplicable a la solicitud, revisión, aprobación y procesamiento de los desembolsos de los Fondos Disponibles para Desembolso recaudados a través de las Campañas publicadas en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Esta Política complementa los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "section",
        "text": "1.2. Alcance"
      },
      {
        "type": "paragraph",
        "text": "La presente Política es aplicable a las Personas Organizadoras que soliciten el desembolso de los Fondos Disponibles para Desembolso de una Campaña."
      },
      {
        "type": "paragraph",
        "text": "Los desembolsos estarán sujetos a los presentes lineamientos, a los Términos y Condiciones de Uso de la Plataforma Minka y a las demás Políticas de Minka que resulten aplicables."
      },
      {
        "type": "paragraph",
        "text": "Los términos utilizados con mayúscula inicial en la presente Política tendrán el significado establecido en los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 2. SOLICITUD DE DESEMBOLSO"
      },
      {
        "type": "section",
        "text": "2.1. Solicitud"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá solicitar el desembolso de los Fondos Disponibles para Desembolso durante la vigencia de su Campaña, a través de las funcionalidades habilitadas en la plataforma."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá solicitar el desembolso de la totalidad o de una parte de los Fondos Disponibles para Desembolso, conforme a las funcionalidades habilitadas en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Cuando se solicite un desembolso parcial, el monto solicitado deberá ser igual o superior al monto mínimo establecido por Minka. Dicho monto mínimo podrá ser definido, modificado y actualizado por Minka en cualquier momento, según sus criterios operativos, y será informado a la Persona Organizadora a través de la Plataforma al momento de realizar la solicitud de desembolso."
      },
      {
        "type": "paragraph",
        "text": "La finalización de la Campaña no impedirá que la Persona Organizadora solicite el desembolso de los Fondos Disponibles para Desembolso existentes al momento de la finalización."
      },
      {
        "type": "section",
        "text": "2.2. Información bancaria"
      },
      {
        "type": "paragraph",
        "text": "Al solicitar un desembolso, la Persona Organizadora deberá proporcionar la información bancaria requerida por la Plataforma, incluyendo el nombre del titular de la cuenta, el número de cuenta, el banco de destino y el tipo de cuenta."
      },
      {
        "type": "paragraph",
        "text": "La cuenta bancaria podrá pertenecer a la Persona Organizadora, al Beneficiario o a un tercero."
      },
      {
        "type": "paragraph",
        "text": "Cuando la cuenta pertenezca a un tercero, Minka podrá solicitar información o documentación adicional que permita identificar a su titular y conocer la relación o justificación de su designación."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora deberá verificar que la información bancaria proporcionada sea correcta y corresponda a una cuenta habilitada para recibir la transferencia, siendo responsable de la exactitud de los datos consignados."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 3. REVISIÓN Y PROCESAMIENTO"
      },
      {
        "type": "section",
        "text": "3.1. Revisión de la solicitud"
      },
      {
        "type": "paragraph",
        "text": "Toda solicitud de desembolso será revisada por Minka antes de su aprobación."
      },
      {
        "type": "paragraph",
        "text": "Minka verificará la disponibilidad efectiva de los Fondos Disponibles para Desembolso y la información necesaria para procesar la transferencia."
      },
      {
        "type": "paragraph",
        "text": "Cuando resulte razonablemente necesario, Minka podrá solicitar información, aclaraciones o documentación adicional antes de aprobar el desembolso."
      },
      {
        "type": "section",
        "text": "3.2. Procesamiento del desembolso"
      },
      {
        "type": "paragraph",
        "text": "Una vez aprobada la solicitud, Minka procesará el desembolso en un plazo máximo de tres (3) días hábiles."
      },
      {
        "type": "paragraph",
        "text": "Este plazo podrá extenderse cuando existan circunstancias ajenas al control razonable de Minka, incidencias técnicas, requerimientos de las entidades financieras intervinientes u otras situaciones que impidan o retrasen temporalmente la transferencia."
      },
      {
        "type": "paragraph",
        "text": "El desembolso será realizado a la cuenta bancaria proporcionada por la Persona Organizadora en la solicitud."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 4. COMISIONES Y MONTO NETO"
      },
      {
        "type": "section",
        "text": "4.1. Comisiones aplicables"
      },
      {
        "type": "paragraph",
        "text": "Las Donaciones recibidas a través de la Plataforma estarán sujetas a las comisiones aplicables según el medio de pago utilizado y las condiciones vigentes informadas por Minka."
      },
      {
        "type": "paragraph",
        "text": "Las comisiones podrán incluir los costos asociados al procesamiento de pagos y la comisión correspondiente por el uso de los servicios de la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "Las condiciones y comisiones vigentes serán informadas a través de la Plataforma o de los medios habilitados por Minka."
      },
      {
        "type": "section",
        "text": "4.2. Monto neto del desembolso"
      },
      {
        "type": "paragraph",
        "text": "Antes de realizar el desembolso, Minka deducirá de los Fondos Disponibles para Desembolso las comisiones y demás cargos aplicables."
      },
      {
        "type": "paragraph",
        "text": "El monto resultante de dichas deducciones será transferido a la cuenta bancaria designada por la Persona Organizadora."
      },
      {
        "type": "paragraph",
        "text": "El monto total recaudado que se muestra públicamente en la Campaña podrá ser distinto del monto neto efectivamente desembolsado."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 5. DESEMBOLSOS SUCESIVOS"
      },
      {
        "type": "section",
        "text": "5.1. Nuevas solicitudes de desembolso"
      },
      {
        "type": "paragraph",
        "text": "La realización de un desembolso no implica la finalización de la Campaña."
      },
      {
        "type": "paragraph",
        "text": "Cuando la Campaña permanezca vigente y reciba nuevas Donaciones, la Persona Organizadora podrá solicitar un nuevo desembolso una vez transcurridos al menos quince (15) días calendario desde la anterior solicitud de desembolso aprobada."
      },
      {
        "type": "paragraph",
        "text": "Cada nueva solicitud comprenderá la totalidad de los Fondos Disponibles para Desembolso al momento de realizarla y estará sujeta al procedimiento de revisión y procesamiento previsto en la presente Política."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 6. SUSPENSIÓN, RECHAZO E INCIDENCIAS"
      },
      {
        "type": "section",
        "text": "6.1. Suspensión o rechazo del desembolso"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá suspender temporalmente o rechazar una solicitud de desembolso cuando existan las circunstancias previstas en los Términos y Condiciones de Uso de la Plataforma Minka, incluyendo inconsistencias en la información proporcionada, indicios de fraude, uso indebido de la Plataforma, Legitimación de Ganancias Ilícitas, Financiamiento del Terrorismo u otras actividades ilícitas."
      },
      {
        "type": "paragraph",
        "text": "Durante la revisión, Minka podrá solicitar información, aclaraciones o documentación adicional a la Persona Organizadora."
      },
      {
        "type": "paragraph",
        "text": "La falta injustificada de entrega de la información o documentación solicitada podrá impedir la aprobación del desembolso."
      },
      {
        "type": "section",
        "text": "6.2. Errores en la información bancaria"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora es responsable de verificar la exactitud de la información bancaria proporcionada."
      },
      {
        "type": "paragraph",
        "text": "Cuando Minka ejecute la transferencia conforme a la información consignada en la solicitud, no será responsable por transferencias realizadas a una cuenta incorrectamente registrada por la Persona Organizadora."
      },
      {
        "type": "paragraph",
        "text": "Si la transferencia no pudiera completarse y los fondos no hubieran sido efectivamente transferidos, Minka podrá contactar a la Persona Organizadora para solicitar la corrección de la información bancaria y procesar nuevamente el desembolso."
      },
      {
        "type": "section",
        "text": "6.3. Incidencias en el procesamiento"
      },
      {
        "type": "paragraph",
        "text": "Cuando una incidencia técnica, bancaria o relacionada con un servicio de terceros afecte el procesamiento de un desembolso, Minka podrá realizar las gestiones razonablemente necesarias para revisar la situación y, cuando corresponda, procesar nuevamente la transferencia."
      },
      {
        "type": "paragraph",
        "text": "La existencia de una incidencia no implica que Minka garantice un plazo de resolución cuando su atención dependa de entidades o servicios de terceros."
      },
      {
        "type": "section",
        "text": "6.4. Actualización de la Política"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá actualizar la presente Política cuando resulte necesario para reflejar cambios en sus procesos, servicios o en la normativa aplicable. Las modificaciones serán publicadas o puestas a disposición a través de la Plataforma."
      }
    ]
  },
  {
    "id": "verification",
    "slug": "politica-de-verificacion",
    "title": "POLÍTICA DE VERIFICACIÓN DE CAMPAÑAS DE MINKA",
    "updated": "Última actualización: julio de 2026",
    "blocks": [
      {
        "type": "title",
        "text": "POLÍTICA DE VERIFICACIÓN DE CAMPAÑAS DE MINKA"
      },
      {
        "type": "updated",
        "text": "Última actualización: julio de 2026"
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 1. OBJETO Y ALCANCE"
      },
      {
        "type": "section",
        "text": "1.1. Objeto"
      },
      {
        "type": "paragraph",
        "text": "La presente Política de Verificación de Campañas de Minka establece las condiciones y el procedimiento aplicable a la Verificación de Campañas publicadas en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La Verificación de Campañas tiene por finalidad brindar mayores elementos de confianza a las Personas Donantes y a la comunidad de la Plataforma mediante la revisión de la información y documentación presentada por la Persona Organizadora."
      },
      {
        "type": "paragraph",
        "text": "Esta Política complementa los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "section",
        "text": "1.2. Alcance"
      },
      {
        "type": "paragraph",
        "text": "La presente Política es aplicable a las Personas Organizadoras que soliciten la Verificación de una Campaña."
      },
      {
        "type": "paragraph",
        "text": "La Verificación de Campañas es voluntaria e independiente de la publicación de la Campaña. Una Campaña podrá ser publicada y recibir Donaciones sin encontrarse verificada."
      },
      {
        "type": "paragraph",
        "text": "La Verificación no constituye una auditoría, certificación o garantía sobre la autenticidad absoluta de la información proporcionada, el cumplimiento de la finalidad de la Campaña, el destino de los Fondos Recaudados o la conducta futura de la Persona Organizadora o del Beneficiario."
      },
      {
        "type": "paragraph",
        "text": "Los términos utilizados con mayúscula inicial en la presente Política tendrán el significado establecido en los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 2. SOLICITUD DE VERIFICACIÓN"
      },
      {
        "type": "section",
        "text": "2.1. Solicitud"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora podrá solicitar la Verificación de su Campaña en cualquier momento durante su vigencia, una vez que esta haya sido publicada, a través de las funcionalidades habilitadas en la Plataforma."
      },
      {
        "type": "paragraph",
        "text": "La solicitud de Verificación no implica su aprobación automática y estará sujeta a la revisión de Minka conforme a la presente Política."
      },
      {
        "type": "section",
        "text": "2.2. Información y documentación"
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora deberá proporcionar la información y documentación solicitada por Minka para revisar la Campaña y su finalidad."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá solicitar información, aclaraciones o documentación adicional cuando resulte razonablemente necesario para completar la revisión."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora es responsable de que la información y documentación proporcionada sea veraz, suficiente y se encuentre razonablemente actualizada."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 3. REVISIÓN Y RESULTADO DE LA VERIFICACIÓN"
      },
      {
        "type": "section",
        "text": "3.1. Revisión"
      },
      {
        "type": "paragraph",
        "text": "Minka revisará la información y documentación proporcionada considerando la naturaleza, finalidad y características de la Campaña."
      },
      {
        "type": "paragraph",
        "text": "Durante la revisión, Minka podrá solicitar información, aclaraciones o documentación adicional cuando resulte necesario."
      },
      {
        "type": "paragraph",
        "text": "La revisión se realizará con base en la información disponible al momento del procedimiento de Verificación."
      },
      {
        "type": "section",
        "text": "3.2. Resultado de la Verificación"
      },
      {
        "type": "paragraph",
        "text": "Como resultado de la revisión, Minka podrá aprobar la Verificación, solicitar información adicional o determinar que la Campaña no reúne las condiciones necesarias para ser verificada."
      },
      {
        "type": "paragraph",
        "text": "Cuando la Verificación sea aprobada, la Campaña podrá mostrar un distintivo o indicación que permita identificarla como verificada por Minka."
      },
      {
        "type": "paragraph",
        "text": "La decisión de no verificar una Campaña no implica necesariamente que su finalidad sea falsa o ilícita y no impedirá su permanencia en la Plataforma, salvo que existan circunstancias que justifiquen la adopción de medidas conforme a los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 4. EFECTOS Y VIGENCIA DE LA VERIFICACIÓN"
      },
      {
        "type": "section",
        "text": "4.1. Efectos de la Verificación"
      },
      {
        "type": "paragraph",
        "text": "Una Campaña cuya Verificación haya sido aprobada podrá mostrar un distintivo o indicación que permita identificarla como verificada por Minka."
      },
      {
        "type": "paragraph",
        "text": "El distintivo de Verificación indica que Minka revisó la información y documentación disponible al momento del procedimiento. No constituye una garantía sobre el cumplimiento de la finalidad de la Campaña ni sobre el uso futuro de los Fondos Recaudados."
      },
      {
        "type": "section",
        "text": "4.2. Vigencia y revisión de la Verificación"
      },
      {
        "type": "paragraph",
        "text": "La Verificación permanecerá vigente mientras no existan cambios relevantes, inconsistencias u otras circunstancias que justifiquen una nueva revisión."
      },
      {
        "type": "paragraph",
        "text": "La Persona Organizadora deberá mantener razonablemente actualizada la información de la Campaña e informar a Minka cuando se produzcan cambios relevantes que puedan afectar la información considerada para su Verificación."
      },
      {
        "type": "paragraph",
        "text": "Minka podrá revisar nuevamente una Campaña verificada y solicitar información, aclaraciones o documentación adicional cuando resulte razonablemente necesario."
      },
      {
        "type": "section",
        "text": "4.3. Retiro de la Verificación"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá retirar el distintivo de Verificación cuando la información que sustentó su aprobación haya cambiado de manera relevante, se identifiquen inconsistencias, la Persona Organizadora no proporcione la información o documentación adicional solicitada o concurran otras circunstancias que impidan mantener razonablemente la Verificación."
      },
      {
        "type": "paragraph",
        "text": "El retiro de la Verificación no implica necesariamente que la Campaña sea falsa o ilícita ni determina automáticamente su eliminación de la Plataforma, sin perjuicio de las medidas que Minka pueda adoptar conforme a los Términos y Condiciones de Uso de la Plataforma Minka."
      },
      {
        "type": "chapter",
        "text": "CAPÍTULO 5. TRATAMIENTO DE LA INFORMACIÓN Y ACTUALIZACIÓN DE LA POLÍTICA"
      },
      {
        "type": "section",
        "text": "5.1. Tratamiento de la información"
      },
      {
        "type": "paragraph",
        "text": "La información y documentación proporcionada directamente a Minka para fines de Verificación será tratada de conformidad con la Política de Privacidad de Minka y no será publicada por Minka como parte de la Campaña, salvo autorización de la persona correspondiente o cuando resulte legalmente exigible."
      },
      {
        "type": "section",
        "text": "5.2. Actualización de la Política"
      },
      {
        "type": "paragraph",
        "text": "Minka podrá actualizar la presente Política cuando resulte necesario para reflejar cambios en el procedimiento de Verificación, en la Plataforma o en la normativa aplicable."
      },
      {
        "type": "paragraph",
        "text": "Las modificaciones serán publicadas o puestas a disposición a través de la Plataforma."
      }
    ]
  }
] as const satisfies readonly LegalDocument[];

export const termsDocument = legalDocuments.find((document) => document.id === "terms")!;
export const privacyDocument = legalDocuments.find((document) => document.id === "privacy")!;
