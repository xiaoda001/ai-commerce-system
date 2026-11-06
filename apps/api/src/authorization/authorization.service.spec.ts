import { newEnforcer, newModelFromString } from 'casbin';
import { AuthorizationService } from './authorization.service';
import { CASBIN_MODEL } from './casbin.model';

describe('AuthorizationService market domains', () => {
  it('keeps policies isolated by market and allows super admins in both markets', async () => {
    const enforcer = await newEnforcer(newModelFromString(CASBIN_MODEL));
    await enforcer.addGroupingPolicy('us-operator', 'catalog', 'US');
    await enforcer.addPolicy('catalog', 'US', 'product.read', 'read');
    await enforcer.addGroupingPolicy('root-admin', 'super_admin', 'US');
    await enforcer.addGroupingPolicy('root-admin', 'super_admin', 'CN');
    for (const market of ['US', 'CN']) {
      await enforcer.addPolicy('super_admin', market, 'product.read', 'read');
    }
    const service = new AuthorizationService(enforcer);

    await expect(service.allows('us-operator', 'US', 'product.read')).resolves.toBe(true);
    await expect(service.allows('us-operator', 'CN', 'product.read')).resolves.toBe(false);
    await expect(service.allows('root-admin', 'US', 'product.read')).resolves.toBe(true);
    await expect(service.allows('root-admin', 'CN', 'product.read')).resolves.toBe(true);
  });
});
