import {parserArgs} from 'node:util';

export function getCliArgs(){
    const options = {
        city: {type: 'string', short: 'c'},
        days: {type: 'string', short: 'd', default: '3'},
        'no-cache': {type: 'boolean', default: 'false'},
    };

    try {
        const {value} = parserArgs({options, allowPositionals: false});

        if (!value.city || !value.city.trim()){
            throw new Error('Обязательное заполнение city');
        }

        const cities = value.city
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        
        if (cities.length === 0){
            throw new Error('Укажите город');
        }

        const days = Number(value.days);
        if (Number.isNaN(days) || days < 1 || days > 7){
            throw new Error('Параметр день должен быть от 1 до 7');
        }

        return {
            cities,
            days,
            noCache: value['no-cache'],
        };
    } catch (error){
        throw new Error('Ошибка аргументов Cli: ${error.message}');
    }
}