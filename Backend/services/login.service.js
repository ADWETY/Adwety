const { User } = require('../models');
const { AppError } = require('../utils/helpers');
const { verifyPassword, maybeUpgradePasswordHash } = require('./password.service');
const { createSessionTokens } = require('./session.service');
const { createChallenge } = require('./mfa.service');
const { adminRequiresMfa, isLegacyAdminMfaExempt } = require('./mfa-policy.service');
const abuse = require('./auth-abuse.service');

async function beginLogin(email,password,req){
  const normalized=String(email||'').trim().toLowerCase();
  const locked=await abuse.lockRemaining(normalized,req.ip);
  if(locked){req.res?.setHeader('Retry-After',String(locked)); throw new AppError('Invalid email or password',401);}
  const user=await User.findOne({email:normalized}).select('+passwordHash +mfaSecretEncrypted +mfaRecoveryCodeHashes');
  const ok=user?await verifyPassword(password,user.passwordHash):false;
  if(!user||!ok||user.isActive===false){const f=await abuse.recordFailure(normalized,req.ip); if(f.lockSeconds) req.res?.setHeader('Retry-After',String(f.lockSeconds)); throw new AppError('Invalid email or password',401);}
  await abuse.clearFailures(normalized,req.ip);
  const legacyHash = !String(user.passwordHash || '').startsWith('v2$');
  let passwordUpgradeRecommended = Number(user.passwordPolicyVersion || 1) < 2;

  // Existing accounts remain usable. A legacy password that already satisfies
  // the current policy is upgraded transparently; otherwise login succeeds and
  // the UI receives a non-blocking recommendation to change it.
  if (legacyHash) {
    const upgraded=await maybeUpgradePasswordHash(password,user.passwordHash,{email:user.email,fullName:user.fullName});
    if(upgraded){
      user.passwordHash=upgraded;
      user.passwordPolicyVersion=2;
      passwordUpgradeRecommended=false;
    }else{
      user.passwordPolicyVersion=1;
      passwordUpgradeRecommended=true;
    }
  }else if(Number(user.passwordPolicyVersion || 1) < 2){
    user.passwordPolicyVersion=2;
    passwordUpgradeRecommended=false;
  }

  user.lastLoginAt=new Date(); await user.save();

  // MFA grandfathering: existing administrators (policy version 1 / missing)
  // enter directly. New administrators and administrators who already enrolled
  // in MFA still use the MFA flow.
  if(user.role==='admin' && adminRequiresMfa(user)){
    if(user.mfaEnabled) return {user,passwordUpgradeRecommended,mfa:{mfa_required:true,mfa_setup_required:false,...await createChallenge(user,req,'login')}};
    return {user,passwordUpgradeRecommended,mfa:{mfa_required:true,mfa_setup_required:true,...await createChallenge(user,req,'setup')}};
  }

  return {
    user,
    passwordUpgradeRecommended,
    mfaGrandfathered: isLegacyAdminMfaExempt(user),
    tokens: await createSessionTokens(user,req)
  };
}
module.exports={beginLogin};
