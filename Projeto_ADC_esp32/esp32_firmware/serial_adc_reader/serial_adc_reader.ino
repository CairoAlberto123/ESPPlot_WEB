/*
Código desenvolvido por: Cairo Alberto  
Estudante de Engenharia da Computação - PUC Goiás  
Repositório: https://github.com/CairoAlberto123  
Data de criação: 2025-04-01  
Descrição: Firmware para leitura do ADC e transmissão via USB Serial  
Tecnologias utilizadas: ESP32, Arduino IDE, C/C++  
Licença: MIT  
2025 Cairo Alberto - Todos os direitos reservados.
*/

#include <Arduino.h>

// ============================================================================
// Função: initADC
// Descrição: Inicializa o ADC. No ESP32, as configurações padrão já são 
// geralmente suficientes, mas a função pode ser expandida conforme necessário.
// ============================================================================
void initADC() {
    // Configurações iniciais para o ADC (pode ser adaptado para leituras mais precisas)
}

// ============================================================================
// Função: readADC
// Descrição: Realiza a leitura do ADC no pino 34 e retorna o valor lido.
// ============================================================================
int readADC() {
    // Leitura do ADC (pino 34 é utilizado como exemplo)
    int adcValue = analogRead(34);
    return adcValue;
}

// ============================================================================
// Função: setup
// Descrição: Inicializa a comunicação serial e o ADC.
// ============================================================================
void setup() {
    // Inicializa a comunicação serial via USB (USB-C)
    Serial.begin(115200);
    // Inicializa o ADC
    initADC();
}

// ============================================================================
// Função: loop
// Descrição: Leitura contínua do ADC e envio dos dados via comunicação serial.
// ============================================================================
void loop() {
    // Leitura do valor do ADC
    int adcValue = readADC();
    // Envio do valor lido via Serial USB
    Serial.println(adcValue);
    // Delay para evitar sobrecarga (ajustável conforme necessidade)
    delay(100); 
}
