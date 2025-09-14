const { hashPassword, comparePassword } = require('../../../utils/hashPassword');

describe('Hashage de mot de passe', () => {
  test('Devrait produire un hash différent du mot de passe brut', async () => {
    const password = 'Password123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
  });

  test('comparePassword devrait valider le mot de passe correct', async () => {
    const password = 'Password123!';
    const hash = await hashPassword(password);

    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  test('comparePassword devrait refuser un mot de passe incorrect', async () => {
    const password = 'Password123!';
    const wrongPassword = 'WrongPass!';
    const hash = await hashPassword(password);

    const isValid = await comparePassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });
});
