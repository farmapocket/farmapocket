# TODO 

## Próximos passos

- Implementar cadastro de procedimentos
    - Incluir o cadastro de procedimentos na bandeja
    - Já criei a tabela e atualizei o arquivo TABLES_SCHEMA.sql
---
- Nos campos de seleção de profissionais, seria interessante uma opção de inclusão rápida para profissionais que não existem na tabela. Essa opção abriria a tela de cadastro de profissionais e ao final preencheria o seletor com o profissional novo
---
-  Permitir que o usuário defina horários fixos para o tratamento, ao invés de informar apenas o intervalo em horas
---
-  Permitir que tratamentos tenham espaçamentos maiores (Ex. Um tratamento onde o remédio é ingerido apenas uma vez por semana)
---
- Implementar a lógica de vencimento das receitas, com:
    - Alerta para marcar consulta
---
- Não podemos ter estoque negativo: Se uma ação "Tomar" encontrar uma quantidade menor que a solicit
---
- Funcionalidade de estoque baixo
    - Para remédios de uso contínuo
---
- O Aplicativo precisa se auto-explicar
---
- Implementar visualização da linha do tempo dos tratamentos, sintomas e procedimentos
---
- Importar arquivo com profissionais, medicações, tratamentos e sintomas
---
- As operações estão lentas e dá um aspecto de travamento. Poderíamos ter ações assíncronas?
---
-  Uma splash screen para o carregamento do painel, o aplicativo abre com a tela sem informações, parece que não está funcionando
---
- É possível fazer com que o aplicativo envie notificações e alarmes?
---

## Últimas implementações:

- [x] Implementar cadastro de sintomas
    - Incluir o cadastro de sintomas na bandeja
    - Sinalizar se o sintoma é bom, neutro ou ruim (botões com carinhas). Armazenar essa informação no campo severity da tabela
    - Incluir a funcionalidade de edição
---
- [x] No card de medicação, incluir a informação de quantas receitas existem para aquela medicação, e quantas unidades do total de receitas
---
- [x] Nos campos de seleção de medicação, seria interessante uma opção de inclusão rápida para medicações que não existem na tabela. Essa opção abriria a tela de cadastro de medicação e ao final preencheria o seletor com a medicação nova
---
- [x] Incluir dentro da tela de configurações um botão para uma tela de log que mostra os últimos 10 registros das tabelas "scheduling" e "treatments_in_schedule". Gostaria de uma mecânica de carrossel. Ao abrir a tela de log apareceria o últomo registro e ao arrastar para a esquerda passaria para o penúltimo, e assim por diante
---
- [x] Quando clicamos em "Pular", não podemos ter a opção de adicionar mais medicações, esta opção é exclusiva da ação "Tomar"
---
- [x] BUG FIX: Não estão aparecendo medicações no card "Última ação"
---
- [x] incluir um card abaixo de "Próximas doses". Neste card, aparecerá a última ação registrada em "scheduling" e "treatments_in_schedule". Nos mesmos moldes do card acima, mas abaixo do horário teremos a informação se as medicações foram tomadas ou puladas, e vamos mover o botão "Reverter" para esse card.
---
- [x] Na modal que abre no botão "Tomar" da área de "Próximas doses", quero ter a opção de incluir medicações adicionais (quantos forem necessários), com suas respectivas quantidades
---
- [x] Na área "Próximas doses", preciso da opção "Reverter" abaixo de "Pular". A Função Reverter Deve desfazer (excluir) a última operação registrada nas tabelas "scheduling" e "treatments_in_schedule", atualizando as quantidades dos medicamentos se a operação for do tipo "TAKEN"
---
- [x] Funcionalidade de editar medicamentos
---
- [x] Cadastro de receitas médicas
---
- [x] Identificar os medicamentos como "Medicação de Resgate".
