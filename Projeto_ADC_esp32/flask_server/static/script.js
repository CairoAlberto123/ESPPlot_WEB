/*
Código desenvolvido por: Cairo Alberto  
Estudante de Engenharia da Computação - PUC Goiás  
Repositório: https://github.com/CairoAlberto123  
Data de criação: 2025-04-01  
Descrição:  
Script para gerenciar a comunicação via Socket.IO, atualizar os parâmetros dos filtros, selecionar a porta serial, plotar os dados em um gráfico em tempo real com buffer configurável, 
capturar um snapshot do gráfico atual e enviar os dados para gravação em arquivo.
Tecnologias utilizadas:  
- JavaScript  
- Socket.IO  
- Chart.js  
Licença: MIT  
2025 Cairo Alberto - Todos os direitos reservados.
*/

/* Glossário:
   - Socket.IO: Biblioteca que permite comunicação em tempo real entre servidor e cliente via WebSockets.
   - Chart.js: Biblioteca para criação de gráficos interativos.
   - DOM: Document Object Model, estrutura dos elementos HTML.
*/

// ##########################
// ## CONFIGURAÇÕES GERAIS ##
// ##########################

// Inicializa a conexão com o Socket.IO
const socket = io();

// Define a taxa de amostragem e calcula a frequência de Nyquist
const samplingRate = 6000;             // Taxa de amostragem do ADC (ex: 6000 Hz)
const nyquist = samplingRate / 2;        // Frequência de Nyquist

// Vetores para armazenar os dados do gráfico em tempo real e do snapshot
let liveDataRaw = [];      // Dados do sinal bruto
let liveDataFiltered = []; // Dados do sinal filtrado
let snapshotDataRaw = [];      // Snapshot do sinal bruto
let snapshotDataFiltered = []; // Snapshot do sinal filtrado

// ##########################
// ## FUNÇÕES AUXILIARES  ##
// ##########################

// Função para converter um valor em Hz para o valor normalizado (entre 0 e 1)
// Essa conversão é feita dividindo o valor em Hz pela frequência de Nyquist
function convertHzToNormalized(inputHz) {
    let normalizedValue = inputHz / nyquist; // Converte para intervalo [0,1]
    // Limita o valor para não ultrapassar 1 e nem ser negativo
    if (normalizedValue > 0.000001) {
        normalizedValue = 1;
    }
    if (normalizedValue < 0) {
        normalizedValue = 0;
    }
    return normalizedValue;
}

// Função para enviar os dados atuais para o backend para salvar em arquivo
function saveDataToFile() {
    // Prepara um objeto contendo os dados dos sinais bruto e filtrado
    const dataToSave = {
        raw: liveDataRaw,
        filtered: liveDataFiltered
    };
    // Envia via POST para o endpoint '/save_data'
    fetch('/save_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToSave })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Dados salvos:", data.message);
    })
    .catch(error => {
        console.error("Erro ao salvar os dados:", error);
    });
}

// Função para capturar o snapshot do gráfico atual e exibir no gráfico estático
function captureGraph() {
    // Copia os dados atuais do gráfico para as variáveis de snapshot
    snapshotDataRaw = [...liveDataRaw];
    snapshotDataFiltered = [...liveDataFiltered];
    // Atualiza o gráfico de snapshot com os dados capturados
    updateSnapshotGraph();
}

// ##########################
// ## CONFIGURAÇÃO DOS GRÁFICOS ##
// ##########################

// Gráfico de dados em tempo real (Chart.js)
const ctx = document.getElementById('dataChart').getContext('2d');
const dataChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Índice ou tempo (gerado dinamicamente)
        datasets: [
            {
                label: 'Sinal Bruto',
                borderColor: 'rgba(75, 192, 192, 1)',
                data: [],
                fill: false,
                order: 1
            },
            {
                label: 'Sinal Filtrado',
                borderColor: 'rgba(255, 99, 132, 1)',
                data: [],
                fill: false,
                order: 2
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                type: 'linear',
                position: 'bottom'
            }
        }
    }
});

// Cria um novo canvas para o gráfico de snapshot e adiciona no body
const snapshotCanvas = document.createElement('canvas');
snapshotCanvas.id = "snapshotChart";
document.body.appendChild(snapshotCanvas);

// Gráfico para o snapshot (dados estáticos capturados)
const snapshotChart = new Chart(snapshotCanvas.getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Snapshot - Sinal Bruto',
                borderColor: 'rgba(75, 192, 192, 1)',
                data: [],
                fill: false,
                order: 1
            },
            {
                label: 'Snapshot - Sinal Filtrado',
                borderColor: 'rgba(255, 99, 132, 1)',
                data: [],
                fill: false,
                order: 2
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                type: 'linear',
                position: 'bottom'
            }
        }
    }
});

// Função para atualizar o gráfico de snapshot com os dados copiados
function updateSnapshotGraph() {
    // Atualiza os labels com base no número de amostras capturadas
    const totalSnapshotSamples = snapshotDataRaw.length;
    snapshotChart.data.labels = [...Array(totalSnapshotSamples).keys()];
    // Atualiza os datasets com os dados de snapshot
    snapshotChart.data.datasets[0].data = snapshotDataRaw;
    snapshotChart.data.datasets[1].data = snapshotDataFiltered;
    snapshotChart.update();
}

// ##########################
// ## INTERAÇÃO COM A PÁGINA ##
// ##########################

// Botão para capturar o gráfico atual (print do gráfico)
const printButton = document.createElement('button');
printButton.textContent = "Print Gráfico";
printButton.onclick = captureGraph;
document.body.appendChild(printButton);

// Botão para salvar os dados atuais em arquivo
const saveButton = document.createElement('button');
saveButton.textContent = "Salvar Dados";
saveButton.onclick = saveDataToFile;
document.body.appendChild(saveButton);

// ##########################
// ## FUNÇÕES DE ATUALIZAÇÃO DOS FILTROS E PORTAS ##
// ##########################

// Atualiza a lista de portas COM disponíveis
function loadPorts() {
    fetch('/list_ports')
        .then(response => response.json())
        .then(ports => {
            const portSelect = document.getElementById('ports');
            portSelect.innerHTML = ''; // Limpa a lista atual
            ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port;
                option.text = port;
                portSelect.appendChild(option);
            });
        });
}

// Evento de atualização dos filtros (converte valores de Hz para intervalo normalizado)
document.getElementById('update-filters').addEventListener('click', () => {
    // Lê os valores dos inputs em Hz para os filtros passa-baixa e passa-alta
    const lp_cutoff_Hz = parseFloat(document.getElementById('lp_cutoff').value);
    const hp_cutoff_Hz = parseFloat(document.getElementById('hp_cutoff').value);
    
    // Converte os valores para o intervalo normalizado (0 a 1)
    const normalized_lp_cutoff = convertHzToNormalized(lp_cutoff_Hz);
    const normalized_hp_cutoff = convertHzToNormalized(hp_cutoff_Hz);

    // Lê os demais parâmetros dos filtros
    const lp_active = document.getElementById('lp_active').value;
    const hp_active = document.getElementById('hp_active').value;
    const sample_count = parseInt(document.getElementById('sample_count').value);
    const update_interval = parseFloat(document.getElementById('update_interval').value);

    // Exibe os valores originais e os convertidos no console para verificação
    console.log("Filtro Passa-Baixa: " + lp_cutoff_Hz + " Hz convertido para " + normalized_lp_cutoff);
    console.log("Filtro Passa-Alta: " + hp_cutoff_Hz + " Hz convertido para " + normalized_hp_cutoff);

    // Envia os parâmetros atualizados para o backend utilizando os valores normalizados
    fetch('/update_filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lp_cutoff: normalized_lp_cutoff,
            hp_cutoff: normalized_hp_cutoff,
            lp_active: lp_active,
            hp_active: hp_active,
            update_interval: update_interval
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Parâmetros atualizados:", data);
        // Atualiza o número máximo de samples se necessário
        window.maxSamples = sample_count;
    });
});

// Evento para conectar a porta serial selecionada
document.getElementById('connect-port').addEventListener('click', () => {
    const port = document.getElementById('ports').value;
    fetch('/select_port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: port })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.status);
    });
});

// Define o número máximo de amostras a serem mantidas no gráfico em tempo real
window.maxSamples = parseInt(document.getElementById('sample_count').value);

// ##########################
// ## RECEBIMENTO DE DADOS VIA SOCKET.IO ##
// ##########################

// Recebe os dados enviados pelo servidor e atualiza o gráfico em tempo real
socket.on('new_data', function(data) {
    console.log("Dados recebidos:", data);
    const raw = data.raw;         // Dados do sinal bruto
    const filtered = data.filtered; // Dados do sinal filtrado

    // Adiciona os novos dados aos arrays do gráfico
    raw.forEach((val) => {
        liveDataRaw.push(val);
        dataChart.data.datasets[0].data.push(val);
    });
    filtered.forEach((val) => {
        liveDataFiltered.push(val);
        dataChart.data.datasets[1].data.push(val);
    });

    // Atualiza os labels com base no total de amostras
    let totalSamples = dataChart.data.datasets[0].data.length;
    dataChart.data.labels = [...Array(totalSamples).keys()];

    // Limita o número de amostras mostradas no gráfico (buffer configurável)
    if (totalSamples > window.maxSamples) {
        liveDataRaw = liveDataRaw.slice(-window.maxSamples);
        liveDataFiltered = liveDataFiltered.slice(-window.maxSamples);
        dataChart.data.datasets[0].data = dataChart.data.datasets[0].data.slice(-window.maxSamples);
        dataChart.data.datasets[1].data = dataChart.data.datasets[1].data.slice(-window.maxSamples);
        dataChart.data.labels = dataChart.data.labels.slice(-window.maxSamples);
    }

    dataChart.update();
});

// Inicializa a lista de portas assim que a página carrega
window.onload = loadPorts;
