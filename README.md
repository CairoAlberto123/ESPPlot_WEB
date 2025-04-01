# ESPPlot_WEB


# **Projeto: Monitoramento de Dados em Tempo Real com ESP32 e Python**  

## **Descrição**  
Este projeto consiste em um sistema de monitoramento de dados em tempo real utilizando um **ESP32** para a captura de informações e um **script Python** para processar e exibir os dados graficamente. A comunicação entre o ESP32 e o computador ocorre via **protocolo serial (UART)**, permitindo a transmissão eficiente dos dados.  

O sistema exibe um **gráfico dinâmico** que atualiza conforme novos dados são recebidos. Além disso, o tempo de atualização do gráfico pode ser ajustado diretamente pelo frontend, permitindo maior flexibilidade no monitoramento.  

## **Recursos**  
- Leitura e envio de dados em tempo real pelo ESP32.  
- Comunicação serial com um script Python.  
- Exibição de um gráfico dinâmico utilizando **matplotlib**.  
- Interface que permite ajustar o intervalo de atualização do gráfico.  

## **Tecnologias Utilizadas**  
- **Hardware:** ESP32  
- **Linguagem de programação:** Python  
- **Bibliotecas:**  
  - `pyserial` (comunicação serial)  
  - `matplotlib` (exibição gráfica)  
  - `time` (gerenciamento de tempo)  

## **Como Usar**  
1. **Upload do código no ESP32:** Certifique-se de carregar o código correto no microcontrolador.  
2. **Executar o script Python:** Rodar o script para iniciar a recepção e exibição dos dados.  
3. **Ajustar o tempo do gráfico:** Utilizar a interface para definir o intervalo desejado de atualização.  

## **Futuras Melhorias**  
- Implementação de um painel web para exibição de multiplos tipos de dados.  
- Integração com banco de dados para armazenamento das leituras.  
- Suporte para múltiplos sensores e formatos de dados.  

