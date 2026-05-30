# Estrutura de Diretórios do Projeto

Este documento mapeia detalhadamente a árvore de diretórios do projeto final para facilitar o entendimento de responsabilidades, arquitetura e navegação.

## Árvore Completa

```txt
TEstar/
 ├── .vscode/               # Configurações locais da IDE (ignoráveis)
 ├── src/
 │   ├── main/
 │   │   ├── java/com/ipem/api/
 │   │   │   ├── infrastructure/
 │   │   │   │   ├── models/        # Entidades base genéricas (ex: BaseEntity)
 │   │   │   │   └── security/      # Configurações Spring Security, JWT (Filtros, Token Service)
 │   │   │   │
 │   │   │   ├── modules/           # Domínios de negócio separados e modulares (DDD style)
 │   │   │   │   ├── export/        # Geração e exportação de dados (CSV, etc)
 │   │   │   │   ├── service/       # Lógica central: Chamados, Incidentes, Abastecimentos, Histórico
 │   │   │   │   ├── user/          # Autenticação, Cadastro de Funcionários e Gestão
 │   │   │   │   └── vehicle/       # Gestão de Veículos e Frota
 │   │   │   │
 │   │   │   └── IpemBackendApplication.java # Classe principal de execução (Entrypoint)
 │   │   │
 │   │   └── resources/
 │   │       ├── db/migration/      # Scripts Flyway para controle de versão do banco (Tabelas, Inserts, Triggers)
 │   │       ├── static/            # Frontend (HTML, CSS, JS) - Vanilla e Modularizado
 │   │       │   ├── css/           # Estilos para páginas
 │   │       │   ├── js/            # Scripts para comunicação com a API (fetch)
 │   │       │   └── img/           # Assets e ícones
 │   │       └── application.properties # Variáveis de ambiente e configuração de banco e API
 │   │
 │   └── test/                      # Testes automatizados do ecossistema
 │
 ├── compose.yaml           # Infraestrutura via Docker Compose (Banco de Dados e Serviços)
 ├── Dockerfile             # Definição do container da API Java
 ├── pom.xml                # Dependências do ecossistema (Maven)
 ├── apply_fixes.py         # Script Python de suporte e automação
 ├── generate_inserts.py    # Script Python para geração massiva de testes no BD
 └── test_api.py            # Scripts de testada em endpoints localmente
```

## Explicação Detalhada de Módulos (DDD)

A aplicação backend foi subdividida em `/modules` para focar em contextos de negócios isolados (Domain-Driven Design). Cada módulo contém:
- **`controller/`**: Camada que lida com requisições HTTP (Endpoints REST), mapeamento de rotas e validações superficiais de payload.
- **`service/`**: Camada que executa lógicas de negócio pesadas. Ponto onde as regras corporativas acontecem (cálculos, auditorias, conversões, disparos).
- **`repository/`**: Camada de persistência. Contém interfaces Spring Data JPA que injetam comandos SQL automaticamente ao estender de `JpaRepository`.
- **`model/`**: Classes de Entidades (Entities). Mapeiam as tabelas do banco de dados (ex: `@Entity`, `@Table`). Possui também o pacote `/enums` interno.
- **`dto/`**: Data Transfer Objects. Objetos para transitar dados de forma otimizada e segura pelas requisições sem expor todas as colunas do banco (ex: `RequestDTO`, `ResponseDTO`).

### Relação Front-end e Back-end (Fluxo)
1. **Frontend (`/resources/static/`)**: Composto por arquivos HTML que não possuem motores de renderização complexos rodando backend (como Thymeleaf). A interatividade é gerenciada via Javascript modularizado na pasta `js/`.
2. **Autenticação**: O JS no front chama os endpoints de autenticação, captura e salva o JWT Token no `localStorage` do navegador.
3. **Comunicação**: O front engatilha chamadas `fetch` passando o JWT no `Header Authorization` visando as rotas geridas pelos `Controllers` (ex: `/services/historic`).
4. **Respostas**: O back-end devolve DTOs serializados em `JSON` para o Javascript renderizar no DOM (Dashboard, Relatórios, etc).
