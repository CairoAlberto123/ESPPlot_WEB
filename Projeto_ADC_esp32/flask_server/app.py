#!/usr/bin/env python3
"""
Código desenvolvido por: Cairo Alberto  
Estudante de Engenharia da Computação - PUC Goiás  
Repositório: https://github.com/CairoAlberto123  
Data de criação: 2025-04-01  
Descrição:  
Servidor Python que realiza a leitura dos dados da porta serial (selecionável pelo usuário), aplica filtros passa-baixa e passa-alta com parâmetros configuráveis e envia os dados processados para uma interface web em tempo real.  
Tecnologias utilizadas:  
- Python 3  
- Flask  
- Flask-SocketIO  
- PySerial  
- SciPy (para filtros)  
Licença: MIT  
2025 Cairo Alberto - Todos os direitos reservados.
"""

# Importação das bibliotecas necessárias
import threading
import time
import serial
import serial.tools.list_ports
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import numpy as np
from scipy.signal import butter, lfilter
import os

# Inicializa a aplicação Flask e o SocketIO
app = Flask(__name__)

# Diretório de saída
output_dir = 'output'

# Cria o diretório se não existir
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Gera um nome de arquivo único por instância do servidor
timestamp = time.strftime("%Y%m%d-%H%M%S")
output_file = os.path.join(output_dir, f"data_{timestamp}.txt")

socketio = SocketIO(app)

# Variáveis globais para configuração dos filtros e intervalo de atualização
lp_cutoff = 1.0       # Frequência de corte para filtro passa-baixa (Hz)
hp_cutoff = 0.1       # Frequência de corte para filtro passa-alta (Hz)
lp_active = False     # Ativação do filtro passa-baixa
hp_active = False     # Ativação do filtro passa-alta
update_interval = 0.05  # Intervalo de atualização em segundos (pode ser customizado via frontend)

# Taxa de amostragem do sinal (assumida, em Hz)
fs = 10.0

# Função para aplicar filtro passa-baixa utilizando o método Butterworth
def apply_low_pass(data, cutoff, fs, order=2):
    nyq = 0.5 * fs  # Frequência de Nyquist
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    y = lfilter(b, a, data)
    return y

# Função para aplicar filtro passa-alta utilizando o método Butterworth
def apply_high_pass(data, cutoff, fs, order=2):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    y = lfilter(b, a, data)
    return y

# Thread responsável por ler dados da porta serial e processar os filtros com envio periódico
def serial_read_thread(port_name):
    global lp_cutoff, hp_cutoff, lp_active, hp_active, update_interval
    try:
        ser = serial.Serial(port_name, 115200, timeout=1)
        print(f"Conectado à porta: {port_name}")
    except Exception as e:
        print(f"Erro ao conectar na porta {port_name}: {e}")
        return

    buffer = []
    last_send_time = time.time()

    while True:
        try:
            line = ser.readline().decode('utf-8').strip()
            if line:
                value = int(line)
                buffer.append(value)

            if time.time() - last_send_time >= update_interval:
                if len(buffer) > 0:
                    raw_data = np.array(buffer, dtype=float)
                    filtered_data = raw_data.copy()

                    if lp_active:
                        filtered_data = apply_low_pass(filtered_data, lp_cutoff, fs)
                    if hp_active:
                        filtered_data = apply_high_pass(filtered_data, hp_cutoff, fs)

                    socketio.emit('new_data', {
                        'raw': raw_data.tolist(),
                        'filtered': filtered_data.tolist()
                    })
                    buffer = []  # Limpa o buffer após envio
                last_send_time = time.time()

            time.sleep(0.01)
        except Exception as e:
            print("Erro na leitura serial:", e)
            break

# Endpoint para renderizar a página principal
@app.route('/')
def index():
    return render_template('index.html')

# Endpoint para obter a lista de portas COM disponíveis
@app.route('/list_ports')
def list_ports():
    ports = serial.tools.list_ports.comports()
    port_list = [port.device for port in ports]
    return jsonify(port_list)

# Endpoint para atualizar os parâmetros dos filtros e o intervalo de atualização
@app.route('/update_filters', methods=['POST'])
def update_filters():
    global lp_cutoff, hp_cutoff, lp_active, hp_active, update_interval
    data = request.get_json()
    lp_cutoff = float(data.get('lp_cutoff', 1.0))
    hp_cutoff = float(data.get('hp_cutoff', 0.1))
    lp_active = data.get('lp_active', 'false').lower() == 'true'
    hp_active = data.get('hp_active', 'false').lower() == 'true'
    # Atualiza o intervalo de atualização se fornecido
    update_interval = float(data.get('update_interval', 0.05))
    return jsonify({'status': 'ok', 'update_interval': update_interval})

# Endpoint para selecionar a porta serial e iniciar a thread de leitura
@app.route('/select_port', methods=['POST'])
def select_port():
    port = request.get_json().get('port')
    thread = threading.Thread(target=serial_read_thread, args=(port,))
    thread.daemon = True
    thread.start()
    return jsonify({'status': f'Conectado à porta {port}'})

@app.route('/save_data', methods=['POST'])
def save_data():
    """Recebe os dados do frontend e salva no arquivo de saída."""
    data = request.json.get("data", [])
    
    if not data:
        return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400
    
    with open(output_file, 'a') as f:
        for value in data:
            f.write(f"{value}\n")

    return jsonify({"status": "success", "message": "Dados salvos com sucesso!"})


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
