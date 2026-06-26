# Regras de negócios

- Cadastro de Medicamentos
	- Nome
	- princípio ativo
	- url da bula (talvez integrando com uma api que consulte automaticamente)
	- Se é medicamento controlado (sim ou não)
	- Se é de uso contínuo (sim ou não)
	- Laboratório de preferência (relacionar com tabela interna de laboratórios)
	- Categoria (relacionado com uma tabela interna de categorias)
	- Subcategoria (relacionado com uma tabela interna de subcategorias)
	- Quantidade em estoque
	- Data da última atualização de estoque
---
.
- Cadastro de profissionais da saúde
	- Nome
	- Especialidade
---
.
- Cadastro de tratamentos
	- Quem prescreveu (vindo da tabela de Profissionais da Saúde)
	- Medicação
	- Dosagem (quantas unidades)
	- frequência de uso (a cada X horas)
	- horário da primeira dose
	- Objetivo do tratamento
	- Data de início
	- Data de encerramento
	- Observações de administração
	- Qual tratamento está substituíndo
	- Por qual tratamento foi substituído
	- Autonomia (calculando a quantidade de medicamento, calculando o uso diário (dosagem x vezes ao dia)), com base na data da atualização de estoque, sabemos até que data teremos medicamento disponível
	- Tempo de tratamento (calculado com base na data de início até a data atual ou até a data de encerramento, se essa existir. Formato #y, #m e 0d)
---
.
- Cadastro de sintomas
	- Data de início
	- Data de encerramento
---
.
- Cadastro de eventos importantes (cirurgias, procedimentos)
	- Data
	- Objetivo do procedimentos
	- Quem prescreveu (vindo da tabela de Profissionais da Saúde)
---
.
- Cadastro de receituário
	- Quem prescreveu (vindo da tabela de Profissionais da Saúde)
	- Medicamento (vindo da tabela de Medicamentos)
	- Unidades do medicamento
	- Vencimento
	- Status (Válida, Vencida ou Utilizada)
---
.
- Agenda de Hoje (Dashboard)
	- Exibir os dois próximos horários de medicamento do dependente ativo
	- Cada horário é apresentado em um card com:
		- Horário da dose
		- Lista de tratamentos agrupados nesse horário (Medicação e quantidade)
		- Botões: Tomar e Pular
	- Lógica para calcular os próximos horários:
		- Considerar a última entrada na tabela scheduling
		- Com base nos tratamentos ativos, calcular os dois próximos horários e agrupar os tratamentos
		- Se a tabela scheduling estiver vazia, usar o horário do sistema como referência
	- Ação Tomar:
		- Abrir modal com campo "Observações (opcional)", botões OK e Cancelar
		- Ao confirmar:
			- Inserir registro em scheduling com schedule_time, action = 'Taken', notes e dependent_id
			- Inserir registros em treatments_in_schedule vinculando o scheduling a cada tratamento do card
			- Atualizar medications.stock_quantity subtraindo a dosagem e medications.stock_last_updated com a data atual
	- Ação Pular:
		- Abrir modal com campo "Observações (opcional)", botões OK e Cancelar
		- Ao confirmar:
			- Inserir registro em scheduling com schedule_time, action = 'Skipped', notes e dependent_id