# Guia para Estruturação da Planilha Google Sheets

Este documento serve como um guia para configurar uma planilha no Google Sheets que possa importar os dados do arquivo CSV gerado pelo aplicativo e calcular automaticamente as métricas de gestão dos caminhões pipa.

## Estrutura da Planilha

Sugerimos uma planilha com duas abas (páginas):
1.  **`Dados Brutos`**: Para onde você irá importar os dados do arquivo `apontamentos.csv`.
2.  **`Dashboard`**: Onde os cálculos e os resumos visuais serão exibidos.

---

### Aba 1: `Dados Brutos`

Esta aba receberá os dados exatamente como são exportados.

**Como importar:**
1.  Abra sua planilha Google Sheets.
2.  Vá em `Arquivo` > `Importar`.
3.  Faça o upload do arquivo `apontamentos.csv`.
4.  Na janela de importação, escolha a opção **"Substituir a página atual"** ou **"Anexar à página atual"** e certifique-se de que o separador seja detectado como vírgula.

As colunas serão:
- **A**: `id`
- **B**: `funcionario`
- **C**: `data`
- **D**: `horarioCarregamento`
- **E**: `volume`
- **F**: `localAbastecido`
- **G**: `localUmectado`
- **H**: `fotoEscata`
- **I**: `fotoBruta`
- **J**: `apontamentoLocation`
- **K**: `status`

---

### Aba 2: `Dashboard`

Esta aba irá analisar os dados da aba `Dados Brutos` e mostrar os resultados.

#### **Métricas Principais**

| Métrica                      | Fórmula do Google Sheets                                                                                                                              | Descrição                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Volume Total Transportado (m³)** | `=SOMA('Dados Brutos'!E:E)`                                                                                                                           | Soma todo o volume da coluna `volume`.            |
| **Total de Viagens**         | `=CONT.VALORES('Dados Brutos'!A2:A)`                                                                                                                   | Conta o número de apontamentos (viagens) feitos.  |
| **Viagens por Operador**     | Crie uma tabela com o nome dos operadores. Ao lado de cada nome (ex: "Nerias" em `A2`), use: `=CONT.SE('Dados Brutos'!B:B; A2)`                             | Conta quantas viagens cada operador realizou.     |
| **Volume por Operador**      | Em uma tabela similar, ao lado do nome do operador (ex: "Nerias" em `A2`), use: `=SOMASE('Dados Brutos'!B:B; A2; 'Dados Brutos'!E:E)`                     | Soma o volume total transportado por cada operador. |

#### **Análise de Percursos**

Para contar os percursos mais utilizados, você pode usar uma Tabela Dinâmica ou a função `QUERY`.

**Exemplo com `QUERY`:**
Para ver os percursos mais comuns a partir do local de abastecimento "Água Bruta":

```
=QUERY('Dados Brutos'!F:G; "SELECT G, COUNT(G) WHERE F = 'Água Bruta' GROUP BY G ORDER BY COUNT(G) DESC LABEL G 'Destino', COUNT(G) 'Nº de Viagens'")
```

Esta fórmula irá gerar uma tabela com os locais umectados mais frequentes quando o abastecimento é feito na Água Bruta.

#### **Exemplo de Layout para o Dashboard na Planilha**

**Célula A1: Resumo Geral**
- **B2**: Volume Total (m³): `[Fórmula]`
- **B3**: Total de Viagens: `[Fórmula]`

**Célula A5: Desempenho por Operador**
| Operador  | Viagens Realizadas | Volume Transportado (m³) |
| --------- | ------------------ | ------------------------ |
| Nerias    | `[Fórmula]`        | `[Fórmula]`              |
| Ronivaldo | `[Fórmula]`        | `[Fórmula]`              |
| Jorge     | `[Fórmula]`        | `[Fórmula]`              |
| Gustavo   | `[Fórmula]`        | `[Fórmula]`              |

**Célula E5: Análise de Rotas (Abastecimento: Água Bruta)**
- Use a fórmula `QUERY` aqui.

**Célula E15: Análise de Rotas (Abastecimento: Estaca Zero)**
- Use uma fórmula `QUERY` similar, trocando `'Água Bruta'` por `'Estaca Zero'`.

---

Com esta estrutura, a planilha se tornará uma ferramenta poderosa para gerenciar e analisar as operações dos caminhões pipa, atualizando os cálculos automaticamente sempre que novos dados forem importados.