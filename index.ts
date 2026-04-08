/**
 * Exercício TypeScript - Funções de Multiplicação e Saudação
 * Branch: exercicio_ts
 * 
 * Implementação com:
 * - Tipagem forte TypeScript
 * - Tratamento de erros
 * - Logs estruturados (via console)
 * - Rate limiting simples
 * - Sanitização de dados
 */

// ============================================
// TIPOS E INTERFACES
// ============================================

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    function: string;
    message: string;
    data?: any;
}

// ============================================
// SISTEMA DE LOG ESTRUTURADO
// ============================================

class Logger {
    private static log(level: LogLevel, functionName: string, message: string, data?: any): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            function: functionName,
            message: message,
            data: data
        };
        
        // Log estruturado em JSON
        console.log(JSON.stringify(entry));
    }

    static info(functionName: string, message: string, data?: any): void {
        this.log('INFO', functionName, message, data);
    }

    static warn(functionName: string, message: string, data?: any): void {
        this.log('WARN', functionName, message, data);
    }

    static error(functionName: string, message: string, data?: any): void {
        this.log('ERROR', functionName, message, data);
    }
}

// ============================================
// RATE LIMITING SIMPLES
// ============================================

class RateLimiter {
    private static calls: Map<string, number> = new Map();
    private static readonly MAX_CALLS = 10;
    private static readonly RESET_INTERVAL = 60000; // 1 minuto

    static checkLimit(functionName: string): boolean {
        const currentCalls = this.calls.get(functionName) || 0;
        
        if (currentCalls >= this.MAX_CALLS) {
            Logger.warn(functionName, 'Rate limit excedido', { 
                current: currentCalls, 
                max: this.MAX_CALLS 
            });
            return false;
        }
        
        this.calls.set(functionName, currentCalls + 1);
        
        // Reset após 1 minuto
        setTimeout(() => {
            this.calls.delete(functionName);
        }, this.RESET_INTERVAL);
        
        return true;
    }
}

// ============================================
// FUNÇÃO 1: MULTIPLICAÇÃO
// ============================================

/**
 * Multiplica dois números com validação e tratamento de erros
 * @param a - Primeiro número
 * @param b - Segundo número
 * @returns Resultado da multiplicação
 * @throws Error se parâmetros inválidos
 */
function multiplicacao(a: number, b: number): number {
    const functionName = 'multiplicacao';
    
    // Rate limiting
    if (!RateLimiter.checkLimit(functionName)) {
        throw new Error('Limite de chamadas excedido. Aguarde 1 minuto.');
    }
    
    // Validação de tipos (TypeScript já garante em tempo de compilação)
    if (typeof a !== 'number' || typeof b !== 'number') {
        Logger.error(functionName, 'Parâmetros inválidos', { a, b });
        throw new Error('Ambos os parâmetros devem ser números');
    }
    
    // Validação de valores
    if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) {
        Logger.error(functionName, 'Valores inválidos (NaN ou Infinity)', { a, b });
        throw new Error('Os números devem ser finitos e válidos');
    }
    
    // Cálculo
    const resultado = a * b;
    
    // Log de sucesso
    Logger.info(functionName, 'Multiplicação realizada', { a, b, resultado });
    
    return resultado;
}

// ============================================
// FUNÇÃO 2: SAUDAÇÃO
// ============================================
function saudacao(nome: string): string {
    const functionName = 'saudacao';
    
    // Rate limiting
    if (!RateLimiter.checkLimit(functionName)) {
        throw new Error('Limite de chamadas excedido. Aguarde 1 minuto.');
    }
    
    // Validação de tipo
    if (typeof nome !== 'string') {
        Logger.error(functionName, 'Parâmetro inválido', { nome });
        throw new Error('O parâmetro nome deve ser uma string');
    }
    
    // Validação de conteúdo
    const nomeTrim = nome.trim();
    if (nomeTrim.length === 0) {
        Logger.error(functionName, 'Nome vazio');
        throw new Error('O nome não pode estar vazio');
    }
    
    if (nomeTrim.length > 100) {
        Logger.warn(functionName, 'Nome muito longo', { length: nomeTrim.length });
        throw new Error('O nome não pode ter mais de 100 caracteres');
    }
    
    // Sanitização (prevenção de XSS)
    const nomeSanitizado = nomeTrim
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    
    // Concatenação segura
    const resultado = `Olá ${nomeSanitizado}`;
    
    // Log sem expor dados sensíveis
    Logger.info(functionName, 'Saudação gerada', { 
        tamanho: nomeSanitizado.length,
        primeiroCaractere: nomeSanitizado.charAt(0)
    });
    
    return resultado;
}
console.log('\n--- Testando Multiplicação ---');
try {
    console.log('5 x 3 =', multiplicacao(5, 3));
    console.log('0 x 100 =', multiplicacao(0, 100));
    console.log('Teste inválido:', multiplicacao(NaN, 5));
} catch (error: any) {
    console.error('Erro:', error.message);
}

console.log('\n--- Testando Saudação ---');
try {
    console.log(saudacao('Maria'));
    console.log(saudacao('João Silva'));
    console.log('Teste XSS:', saudacao('<script>alert("xss")</script>'));
} catch (error: any) {
    console.error('Erro:', error.message);
}

console.log('\n--- Testando Rate Limiting ---');
try {
    for (let i = 0; i < 15; i++) {
        console.log(`Chamada ${i + 1}:`, saudacao('Teste'));
    }
} catch (error: any) {
    console.error('Rate limit atingido:', error.message);
}