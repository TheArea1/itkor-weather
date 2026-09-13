import { parseArgs } from 'node:util';

export function getCliArgs(){
    const options = {
        city: {type: 'string', short: 'c'},
        days: {type: 'string', short: 'd', default: '3'},
        'no-cache': {type: 'boolean', default: false},
    };

    try {
        const {values} = parseArgs({options, allowPositionals: false});

        if (!values.city || !values.city.trim()){
            throw new Error('Обязательное заполнение city');
        }

        const cities = values.city
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        
        if (cities.length === 0){
            throw new Error('Укажите город');
        }

        const days = Number(values.days);
        if (Number.isNaN(days) || days < 1 || days > 7){
            throw new Error('Параметр день должен быть от 1 до 7');
        }

        return {
            cities,
            days,
            noCache: values['no-cache'],
        };
    } catch (error){
        throw new Error(`Ошибка аргументов Cli: ${error.message}`);
    }
}