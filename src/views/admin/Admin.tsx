import { isAddress } from "@ethersproject/address";
import { useWeb3React } from "@web3-react/core";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import React, { ChangeEvent, useState } from "react";
import { useMutation } from "react-query";
import { useNotify, useToast } from "../../App";
import Button from "../../components/Button";
import Input from "../../components/Input";
import useAdmin, {
  checkPartnerEligibility,
  Eligibility,
  vipTiers,
} from "../../hooks/useAdmin";
import { referrerTiers } from "../../hooks/useRewards";
import AppNav from "../app-nav/AppNav";

type Props = {};

type PartnerRowProps = {
  eligibility: Eligibility;
};

function PartnerRow({ eligibility }: PartnerRowProps) {
  const { assignVip, removeVip, refreshEligibility } = useAdmin();
  const { showToast } = useToast();
  const { library } = useWeb3React();
  const { notify } = useNotify();

  const upgrade = async () => {
    const currentTier = eligibility.tier;
    const tierAbove = referrerTiers[Number(currentTier) + 1];
    if (!tierAbove) {
      showToast("At highest tier already");
      return;
    }
    try {
      showToast("Upgrading...");
      await assignVip(
        library.getSigner(),
        eligibility.address,
        String(Number(currentTier) + 1)
      );
      await refreshEligibility();
      showToast("Upgraded");
    } catch (error) {
      console.log(error);
    }
  };

  const downgrade = async () => {
    const currentTier = eligibility.tier;
    const tierBelow = referrerTiers[Number(currentTier) - 1];
    console.log('tier', {
      tierBelow
    })
    if (!tierBelow || tierBelow.minFees === 0) {
      try {
        const tx = await removeVip(library.getSigner(), eligibility.address);
        if (tx) {
          const { emitter } = notify.hash(tx.hash);
          emitter.on("txConfirmed", async () => {
            await refreshEligibility();
          });
        }
      } catch (error) {}
      return;
    }
    try {
      showToast("Downgrading...");
      const tx = await assignVip(
        library.getSigner(),
        eligibility.address,
        String(Number(currentTier) - 1)
      );
      if (tx) {
        const { emitter } = notify.hash(tx.hash);
        emitter.on("txConfirmed", async () => {
          await refreshEligibility();
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <tr
      key={`${eligibility.address}`}
      className="border-t border-white border-opacity-10 font-normal"
    >
      <td className="w-1 py-4 text-left">Tier {eligibility.tier}</td>
      <td className="w-1 py-4 text-left">{eligibility.code}</td>
      <td className="w-1 py-4 text-left">
        {eligibility.isInTrialPeriod ? "Yes" : "No"}
      </td>
      <td className="w-1 py-4 text-left">
        {formatDistanceToNow(fromUnixTime(Number(eligibility.vipSince)))}
      </td>
      <td className="w-1 py-4 text-left">
        {eligibility.maximumTierEligibleFor === 0
          ? "Not Eligible"
          : `Tier ${eligibility.maximumTierEligibleFor}`}
      </td>
      <td className="w-1 py-4 text-right">
        {true && (
          <div className="h-full flex items-center w-full justify-center">
            <div className="mr-2">
              <Button onClick={upgrade} size="sm">
                Upgrade
              </Button>
            </div>
            <div>
              <Button onClick={downgrade} type="secondary" size="sm">
                Downgrade
              </Button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function Admin(props: Props) {
  const { library, active, account } = useWeb3React();
  const { notify } = useNotify();
  const [partnerAddress, setPartnerAddress] = useState("");
  const [tier, setTier] = useState("");
  const [isValidAddress, setIsValidAddress] = useState(false);
  const {
    isLoadingEligiblePartners,
    eligiblePartners,
    owner,
    isLoadingOwner,
    assignVip,
    removeVip,
    refreshEligibility,
    batchUpdatePartners,
  } = useAdmin();
  const { showToast } = useToast();

  const addVip = async () => {
    if (!tier) {
      showToast("Please enter a tier");
      return;
    }
    showToast("Updating as VIP...");
    const tx = await assignVip(library.getSigner(), partnerAddress, tier);
    if (tx) {
      const { emitter } = notify.hash(tx.hash);
      emitter.on("txConfirmed", async () => {
        await refreshEligibility();
        showToast("Updated as VIP!");
      });
    }
  };

  const deleteVip = async () => {
    showToast("Removing as VIP...");
    const tx = await removeVip(library.getSigner(), partnerAddress);
    if (tx) {
      const { emitter } = notify.hash(tx.hash);
      emitter.on("txConfirmed", async () => {
        await refreshEligibility();
        showToast("Removed as VIP!");
      });
    }
  };

  const onVipAddressInputChange = (event: ChangeEvent<Element>) => {
    const value = (event.target as any).value;
    setPartnerAddress(value);
    if (isAddress(value)) {
      setIsValidAddress(true);
    } else {
      setIsValidAddress(false);
    }
  };

  const batchUpdate = async () => {
    // first filter out people in the trial
    const partnersNotInTrial = eligiblePartners.filter(
      (partner) => !partner.isInTrialPeriod
    );
    const partnersToUpdate = [];
    const tiersToUpdateTo = [];

    for (const partner of partnersNotInTrial) {
      if (partner.tier !== String(partner.maximumTierEligibleFor)) {
        partnersToUpdate.push(partner.address);
        tiersToUpdateTo.push(String(partner.maximumTierEligibleFor));
      }
    }
    if (!partnersToUpdate.length) {
      showToast("Nobody to update...");
      return;
    }
    try {
      showToast("Batch upgrading...");
      await batchUpdatePartners(
        library.getSigner(),
        partnersToUpdate,
        tiersToUpdateTo
      );
      await refreshEligibility();
      showToast("Upgraded");
    } catch (error) {
      console.log(error);
    }
  };

  const onTierChange = (event: ChangeEvent<Element>) => {
    const value = (event.target as any).value;
    setTier(value);
  };

  const showAdminPage = active && owner === account && !isLoadingOwner;
  return (
    <div>
      <AppNav />
      {showAdminPage && (
        <div className="w-full h-full flex justify-center p-16">
          <div className="flex flex-col">
            <div className="mb-4">
              <Input
                value={partnerAddress}
                onChange={onVipAddressInputChange}
                placeholder="Enter a partner address to promote or fire"
              />
            </div>
            <div className="mb-4 w-8 mx-auto">
              <span className="text-white block mb-2">Tier:</span>{" "}
              <Input value={tier} onChange={onTierChange} placeholder="0" />
            </div>

            {isValidAddress && active && (
              <div className="flex mx-auto">
                <div className="mr-2">
                  <Button onClick={addVip} type="primary">
                    Add/Update VIP Tier
                  </Button>
                </div>
                <Button onClick={deleteVip} type="destructive">
                  Remove VIP
                </Button>
              </div>
            )}

            <div className="mt-8 w-full flex justify-center flex-col items-center">
              <h3 className="text-white text-lg font-semibold">
                VIP Partners List
              </h3>
              <div className="flex mx-auto my-2">
                <div className="mr-2">
                  <Button size="sm" onClick={batchUpdate} type="primary">
                    Update all partners
                  </Button>
                </div>
              </div>
              <table
                className="text-white table-fixed w-full mx-auto mt-4"
                style={{ maxWidth: "1100px" }}
              >
                <thead className="uppercase font-medium text-xs text-perp-gray-50">
                  <tr>
                    <th className="w-1 pb-4 pt-1 text-left">Tier</th>
                    <th className="w-1 pb-4 pt-1 text-left">Code</th>
                    <th className="w-1 pb-4 pt-1 text-left">Trial Period</th>
                    <th className="w-1 pb-4 pt-1 text-left">VIP For</th>
                    <th className="w-1 pb-4 pt-1 text-left">
                      Current Eligibility
                    </th>
                    <th className="w-1 pb-4 pt-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoadingEligiblePartners &&
                    active &&
                    (eligiblePartners || []).map((eligibility) => (
                      <PartnerRow
                        key={eligibility.address}
                        eligibility={eligibility}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
