# Documentação Técnica e Implementação - Sistema de Gestão IPEM

## 1. Visão Geral
**Objetivo:** Este projeto é uma API Backend para controle logístico, operacional e administrativo da frota e técnicos de campo do IPEM (Instituto de Pesos e Medidas).
**Funcionalidades Principais:**
- Autenticação e gestão de permissões (JWT).
- Gerenciamento de veículos, quilometragem e abastecimentos.
- Gestão de chamados (criação, check-in, checklists de vistoria, finalização).
- Registro de incidentes no campo.
- Dashboards com métricas, históricos completos de logs e KPIs de ocorrências.
- Geração de relatórios operacionais.
**Melhorias e Escopo Atual:** O escopo engloba garantir persistência segura e rastreável. Houve fortes melhorias arquiteturais para corrigir inconsistências na estrutura de logs do histórico de serviços.

---

## 2. Arquitetura
A arquitetura foi implementada em um monolito modular usando **Java Spring Boot 3**.
- **Front-end:** Páginas estáticas HTML com manipulação interativa do DOM (Vanilla JS) contidas na pasta genérica de resources estáticos do backend, mas que se comunicam exclusivamente via chamadas RESTful (fetch API) provando alto grau de desacoplamento futuro se o front-end migrar para uma Vercel/CDN separada.
- **Back-end:** Java Spring MVC. Trabalha sobre o padrão DDD (Domain-Driven Design), isolando domínios (Service, User, Vehicle).
- **APIs:** Comunicação em JSON `application/json` restrita por permissões de Bearer Token.

---

## 3. Front-end
- **Páginas:** Estão localizadas em `src/main/resources/static/`. Possui navegação de gestão (`telainicial-gestor.html`, `tecnicos-gestor.html`) e navegação do técnico local (`telainicial.html`).
- **Gerenciamento Visual e Dashboards:** A interatividade é modular, em arquivos como `dashboard.js`, atualizando os KPIs do DOM baseando-se em chamadas da API `DashboardService`. O fluxo foca na usabilidade para uso móvel no campo ou web para gestores.
- **Fluxo UI/UX:** Transições fluidas com carregamento por spinner enquanto requisições são resolvidas, utilizando CSS puro (sem Tailwind/Bootstrap acoplado).

---

## 4. Back-end
- **Controllers (`@RestController`):** Mapeiam as rotas `/users/`, `/vehicles/`, `/services/`, validando inputs transacionados por DTOs (`@Valid`).
- **Services (`@Service`):** Aplicam as lógicas de check-in, regras de combustível e cálculo de tempo e finalização de chamados.
- **DTOs:** Utiliza Records ou classes POJO para entrada de dados (RequestDTO) e saída (ResponseDTO), escondendo dados da entidade principal como senhas e timestamps de banco.
- **Repositories:** Baseados em `JpaRepository` estendido do Spring Data JPA, realizando queries seguras (Hibernate/JPQL) que previnem Injection.
- **Autenticação:** Baseada em autenticação stateless com tokens JWT configurados pelo `SecurityFilter`.

---

## 5. Banco de Dados
Banco relacional **MySQL**. O histórico de mudanças estruturais é versionado utilizando a ferramenta **Flyway**.
- **Entidades e Tabelas:** `users`, `vehicles` (cars), `services` (chamados), `service_addresses` (localização), `records` (log de passos), `incidents`, `refuelings`.
- **Relacionamentos:** Serviços pertencem a um Usuário (técnico) e utilizam um Veículo (carro). Relatórios cruzam tabelas `records`, `incidents` e `services` para extrair eficiência e logs detalhados.
- **Migrations:** Em `db/migration/` os scripts `V1__create-tables.sql`, `V2__inserts.sql` (inserções com dados saneados recentemente) e `V3__triggers.sql` padronizam a subida da base sem inconsistências manuais.

---

## 6. APIs
Alguns dos principais blocos de endpoints RESTful:

- **Autenticação (`/auth/login`)**:
  - `POST` / Payload: `{ "registration": "...", "password": "..." }`
  - Retorna `TokenJWTDTO`.

- **Dashboard (`/dashboard/metrics`)**:
  - `GET` / Resposta: Contagem de veículos disponíveis, técnicos em campo, chamados com incidentes. Requer JWT Gestor.

- **Serviços (`/services/*`)**:
  - `GET /historic`: Retorna lista cronológica de records de check-in, check-out ou relatórios parciais.
  - `POST /checkin`: Registra o inicio do técnico no destino, populando a tabela `records`.

---

## 7. Infraestrutura & Docker
A infraestrutura subiu para adequação aos processos DevOps padronizados.
- **Estrutura Compose:** O arquivo principal é o `compose.yaml` (modernizado de docker-compose.yml), contendo definições nativas e limpas, focado no container DB `mysql:8.0` para estabilidade com os plugins de senha padrão expostos na porta `3307`.
- **Dockerfile:** Implementação base para embutir o executável da aplicação via target do Maven e roda no padrão JDK 17 (ou compatível da stack).
- **Execução:**
  1. Compilar projeto: `./mvnw clean package -DskipTests`
  2. Subir banco: `docker compose up -d`
  3. Rodar a aplicação: `java -jar target/app.jar`

---

## 8. Segurança e Auditoria
- **JWT & Auth:** A autenticação bloqueia o acesso via filtros `SecurityFilterChain`. Endpoints de edição são liberados apenas para `Role=MANAGER`.
- **Auditoria de Banco:** Triggers automáticos ou lógica nas Service para gravar `Created_at` e rastrear quem deletou ou atualizou recursos.
- **Logs de Incidentes:** Registrados atrelados diretamente a chamados, impossibilitando exclusão acidental ou modificação fraudulenta do histórico.

---

## 9. Resumo de Melhorias Realizadas
- Correção crítica da query e nomenclatura do Repository do histórico, destravando o relatório de serviços finalizados que antes estava em silêncio de banco de dados.
- Normalização de todos os scripts DDL/DML em Flyway (V2), forçando integridade nas restrições de chaves e timestamps cronológicos realistas para que dashboards analíticos tenham KPIs funcionais.
- Desacoplamento da nomenclatura do log interno (`ARRIVAL_AT_LOCATION`, `CHECK_IN`) garantindo o acompanhamento geográfico em passos na View do usuário.
