import { z } from 'zod';
export const authCredentialsSchema = z.object({
    username: z.string().trim().min(1, 'Укажите логин.').max(64),
    password: z.string().min(1, 'Укажите пароль.').max(256),
});
//# sourceMappingURL=auth.js.map