# TODO 

## Próximos passos

- incluir um card abaixo de "Próximas doses". Neste card, aparecerá a última ação registrada em "scheduling" e "treatments_in_schedule". Nos mesmos moldes do card acima, mas abaixo do horário teremos a informação se as medicações foram tomadas ou puladas, e vamos mover o botão "Reverter" para esse card.
---
- Incluir dentro da tela de configurações um botão para uma tela de log que mostra os últimos registros das tabelas "scheduling" e "treatments_in_schedule"
---
- Nos campos de seleção de medicação, seria interessante uma opção de inclusão rápida para medicações que não existem na tabela. Essa opção abriria a tela de cadastro de medicação e ao final preencheria o seletor com a medicação nova
---
- No card de medicação, incluir a informação de quantas receitas existem para aquela medicação
---
- Implementar cadastro de sintomas
    - Sinalizar se o sintoma é bom, neutro ou ruim (botões com carinhas)
---
- Implementar cadastro de procedimentos
---
- Implementar a lógica de vencimento das receitas, com:
    - Alerta para marcar consulta
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
-  As operações estão lentas e dá um aspecto de travamento. Poderíamos ter ações assíncronas?
---
-  Uma splash screen para o carregamento do painel, o aplicativo abre com a tela sem informações, parece que não está funcionando
---
-  Permitir que o usuário defina horários fixos para o tratamento, ao invés de informar apenas o intervalo em horas
---
-  Permitir que tratamentos tenham espaçamentos maiores (Ex. Um tratamento onde o remédio é ingerido apenas uma vez por semana)
---
- É possível fazer com que o aplicativo envie notificações e alarmes?
---

## Últimas implementações:

- [x] Na modal que abre no botão "Tomar" da área de "Próximas doses", quero ter a opção de incluir medicações adicionais (quantos forem necessários), com suas respectivas quantidades
---
- [x] Na área "Próximas doses", preciso da opção "Reverter" abaixo de "Pular". A Função Reverter Deve desfazer (excluir) a última operação registrada nas tabelas "scheduling" e "treatments_in_schedule", atualizando as quantidades dos medicamentos se a operação for do tipo "TAKEN"
---
- [x] Funcionalidade de editar medicamentos
---
- [x] Cadastro de receitas médicas
---
- [x] Identificar os medicamentos como "Medicação de Resgate".
